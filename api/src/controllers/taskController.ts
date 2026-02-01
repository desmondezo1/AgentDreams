import { Request, Response } from 'express';
import { query } from '../db';
import { toBytes32, getEscrowInstructions, callRelease, callRefund } from '../utils/contract';
import crypto from 'crypto';

export const createTask = async (req: Request, res: Response) => {
  try {
    const {
      id, // Optional - if provided from frontend (blockchain flow)
      title,
      spec,
      payload,
      payout_usdc,
      deadline_at, // ISO string
      verification_mode,
      verifier_type,
      validators,
      requester_wallet,
      escrow_tx_hash // Optional - transaction hash from blockchain funding
    } = req.body;

    // TODO: Add strict validation (zod or manual)

    // 1. Generate or use provided ID
    const taskId = id || crypto.randomUUID();
    const taskIdBytes32 = toBytes32(taskId);

    const deadlineTimestamp = Math.floor(new Date(deadline_at).getTime() / 1000);

    // 2. Insert into DB
    const text = `
      INSERT INTO tasks (
        id, task_id_bytes32, title, spec, payload_ref,
        payout_usdc, deadline_at, verification_mode,
        verifier_type, validator_n, validator_threshold,
        validator_fee_total_usdc, status, requester_wallet, escrow_tx_hash
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, 'OPEN', $13, $14
      ) RETURNING *
    `;

    const values = [
      taskId,
      taskIdBytes32,
      title,
      spec,
      payload || null,
      payout_usdc,
      deadline_at,
      verification_mode || 'REQUESTER',
      verifier_type || null,
      validators?.n || null,
      validators?.threshold || null,
      validators?.fee_total_usdc || null,
      requester_wallet, // "0x..."
      escrow_tx_hash || null
    ];

    const { rows } = await query(text, values);
    const task = rows[0];

    // 3. Emit task.created event to event_stream
    await query(
      `INSERT INTO event_stream (type, task_id, actor_agent_id, data_json)
       VALUES ($1, $2, $3, $4)`,
      [
        'task.created',
        task.id,
        null, // No agent involved yet
        JSON.stringify({
          title: task.title,
          payout: task.payout_usdc,
          payout_usdc: task.payout_usdc,
          requester: task.requester_wallet
        })
      ]
    );

    // 4. Generate Escrow Instructions
    const instructions = getEscrowInstructions(
      taskIdBytes32,
      payout_usdc.toString(), // Convert to string for parseUnits
      deadlineTimestamp,
      process.env.ESCROW_CONTRACT_ADDRESS!,
      process.env.USDC_ADDRESS!
    );

    res.status(201).json({
      task_id: task.id,
      task_id_bytes32: task.task_id_bytes32,
      escrow_instructions: instructions,
      task
    });

  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status, mode } = req.query;
    let text = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      text += ` AND status = $${params.length}`;
    }
    
    // Simple verification mode filter
    if (mode) {
      params.push(mode);
      text += ` AND verification_mode = $${params.length}`;
    }

    text += ' ORDER BY created_at DESC LIMIT 50';

    const { rows } = await query(text, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
      const { id } = req.params;
      const { rows } = await query('SELECT * FROM tasks WHERE id = $1', [id]);
      
      if (rows.length === 0) {
           res.status(404).json({ error: 'Task not found' });
           return;
      }
      res.json(rows[0]);
  } catch (error) {
      console.error('Get Task Error:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const getTaskEvents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'SELECT * FROM event_stream WHERE task_id = $1 ORDER BY created_at ASC', 
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get Task Events Error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const confirmFunding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tx_hash } = req.body;
    
    // Update task status to OPEN and store tx hash
    const { rows } = await query(
      `UPDATE tasks 
       SET status = 'OPEN', escrow_tx_hash = $2, updated_at = NOW() 
       WHERE id = $1 AND status = 'DRAFT' 
       RETURNING *`,
      [id, tx_hash]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Task not found or already funded' });
      return;
    }
    
    // Log event
    await query(
      `INSERT INTO event_stream (type, task_id, data_json) 
       VALUES ('escrow.funded', $1, $2)`,
      [id, JSON.stringify({ tx_hash })]
    );
    
    res.json({ message: 'Funding confirmed', task: rows[0] });
  } catch (error) {
    console.error('Confirm Funding Error:', error);
    res.status(500).json({ error: 'Failed to confirm funding' });
  }
};

export const claimTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { worker_wallet, worker_agent_id } = req.body;
    
    // Atomic claim using UPDATE with status check
    const { rows } = await query(
      `UPDATE tasks 
       SET status = 'CLAIMED', 
           worker_wallet = $2, 
           worker_agent_id = $3,
           updated_at = NOW()
       WHERE id = $1 AND status = 'OPEN'
       RETURNING *`,
      [id, worker_wallet, worker_agent_id || null]
    );
    
    if (rows.length === 0) {
      res.status(409).json({ error: 'Task not available for claiming' });
      return;
    }
    
    // Log event
    await query(
      `INSERT INTO event_stream (type, task_id, actor_agent_id, data_json) 
       VALUES ('task.claimed', $1, $2, $3)`,
      [id, worker_agent_id, JSON.stringify({ worker_wallet })]
    );
    
    res.json({ message: 'Task claimed successfully', task: rows[0] });
  } catch (error) {
    console.error('Claim Task Error:', error);
    res.status(500).json({ error: 'Failed to claim task' });
  }
};

export const getTaskPayload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Add auth check - only requester or claimant can access
    
    const { rows } = await query(
      'SELECT payload_ref FROM tasks WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json({ payload: rows[0].payload_ref });
  } catch (error) {
    console.error('Get Payload Error:', error);
    res.status(500).json({ error: 'Failed to fetch payload' });
  }
};

export const submitResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { result, worker_agent_id } = req.body;
    
    // Generate submission hash
    const submissionHash = crypto.createHash('sha256').update(result).digest('hex');
    
    // Store submission
    await query(
      `INSERT INTO submissions (task_id, worker_agent_id, result_ref, submission_hash)
       VALUES ($1, $2, $3, $4)`,
      [id, worker_agent_id, result, submissionHash]
    );
    
    // Update task status
    const { rows } = await query(
      `UPDATE tasks 
       SET status = 'SUBMITTED', updated_at = NOW()
       WHERE id = $1 AND status = 'CLAIMED'
       RETURNING *`,
      [id]
    );
    
    if (rows.length === 0) {
      res.status(409).json({ error: 'Task not in claimable state' });
      return;
    }
    
    const task = rows[0];
    
    // Log event
    await query(
      `INSERT INTO event_stream (type, task_id, actor_agent_id, data_json) 
       VALUES ('task.submitted', $1, $2, $3)`,
      [id, worker_agent_id, JSON.stringify({ submission_hash: submissionHash })]
    );
    
    // If AUTO mode, trigger verification
    if (task.verification_mode === 'AUTO') {
      // TODO: Implement auto verification
      console.log('AUTO verification triggered for task:', id);
    }
    
    res.json({ 
      message: 'Result submitted successfully', 
      submission_hash: submissionHash,
      task 
    });
  } catch (error) {
    console.error('Submit Result Error:', error);
    res.status(500).json({ error: 'Failed to submit result' });
  }
};

export const acceptResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requester_wallet } = req.body;
    
    // Get task and submission
    const taskResult = await query(
      `SELECT t.*, s.submission_hash 
       FROM tasks t
       LEFT JOIN submissions s ON s.task_id = t.id
       WHERE t.id = $1 AND t.status = 'SUBMITTED'`,
      [id]
    );
    
    if (taskResult.rows.length === 0) {
      res.status(404).json({ error: 'Task not found or not submitted' });
      return;
    }
    
    const task = taskResult.rows[0];
    
    // Verify requester
    if (task.requester_wallet !== requester_wallet) {
      res.status(403).json({ error: 'Only requester can accept results' });
      return;
    }
    
    // Generate result hash for contract
    const resultHash = '0x' + crypto.createHash('sha256')
      .update(task.submission_hash)
      .digest('hex');
    
    // Create receipt
    const receiptPayload = {
      task_id: task.id,
      task_id_bytes32: task.task_id_bytes32,
      mode: 'REQUESTER_ACCEPT',
      submission_hash: task.submission_hash,
      result_hash: resultHash,
      requester: requester_wallet,
      worker: task.worker_wallet,
      payout: task.payout_usdc,
      timestamp: new Date().toISOString()
    };
    
    // Sign receipt (simplified - in production use proper signing)
    const signature = crypto.createHash('sha256')
      .update(JSON.stringify(receiptPayload))
      .digest('hex');
    
    await query(
      `INSERT INTO receipts (task_id, type, payload_json, signature)
       VALUES ($1, 'REQUESTER_ACCEPT', $2, $3)`,
      [id, receiptPayload, signature]
    );
    
    // Call contract release function
    try {
      const txHash = await callRelease(
        task.task_id_bytes32,
        task.worker_wallet,
        resultHash
      );
      
      // Update task status
      await query(
        `UPDATE tasks 
         SET status = 'ACCEPTED', 
             result_hash = $2, 
             release_tx_hash = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [id, resultHash, txHash]
      );
      
      // Log event
      await query(
        `INSERT INTO event_stream (type, task_id, data_json) 
         VALUES ('task.accepted', $1, $2)`,
        [id, JSON.stringify({ tx_hash: txHash, result_hash: resultHash })]
      );
      
      res.json({ 
        message: 'Result accepted and payment initiated',
        tx_hash: txHash,
        receipt: receiptPayload
      });
    } catch (contractError) {
      console.error('Contract call failed:', contractError);
      res.status(500).json({ error: 'Failed to release payment on chain' });
    }
  } catch (error) {
    console.error('Accept Result Error:', error);
    res.status(500).json({ error: 'Failed to accept result' });
  }
};

export const rejectResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requester_wallet, reason } = req.body;
    
    // Get task
    const { rows } = await query(
      'SELECT * FROM tasks WHERE id = $1 AND status = $2',
      [id, 'SUBMITTED']
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Task not found or not submitted' });
      return;
    }
    
    const task = rows[0];
    
    // Verify requester
    if (task.requester_wallet !== requester_wallet) {
      res.status(403).json({ error: 'Only requester can reject results' });
      return;
    }
    
    // Update task status
    await query(
      `UPDATE tasks 
       SET status = 'REJECTED', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    
    // Log event
    await query(
      `INSERT INTO event_stream (type, task_id, data_json) 
       VALUES ('task.rejected', $1, $2)`,
      [id, JSON.stringify({ reason })]
    );
    
    res.json({ message: 'Result rejected', task });
  } catch (error) {
    console.error('Reject Result Error:', error);
    res.status(500).json({ error: 'Failed to reject result' });
  }
};

export const refundTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requester_wallet } = req.body;
    
    // Get task
    const { rows } = await query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const task = rows[0];
    
    // Check if can refund (after deadline or by settler)
    const now = Date.now();
    const deadline = new Date(task.deadline_at).getTime();
    
    if (requester_wallet !== task.requester_wallet) {
      res.status(403).json({ error: 'Only requester can request refund' });
      return;
    }
    
    if (now < deadline) {
      res.status(400).json({ error: 'Deadline not reached yet' });
      return;
    }
    
    // Call contract refund
    try {
      const txHash = await callRefund(task.task_id_bytes32);
      
      // Update task status
      await query(
        `UPDATE tasks 
         SET status = 'REFUNDED', 
             refund_tx_hash = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [id, txHash]
      );
      
      // Log event
      await query(
        `INSERT INTO event_stream (type, task_id, data_json) 
         VALUES ('task.refunded', $1, $2)`,
        [id, JSON.stringify({ tx_hash: txHash })]
      );
      
      res.json({ 
        message: 'Refund initiated',
        tx_hash: txHash
      });
    } catch (contractError) {
      console.error('Contract refund failed:', contractError);
      res.status(500).json({ error: 'Failed to process refund on chain' });
    }
  } catch (error) {
    console.error('Refund Task Error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};
