import { ethers } from 'ethers';
import { query } from '../db';
import { AGENT_DREAMS_ABI } from '../utils/abi';

export class ChainWatcher {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private isRunning: boolean = false;
  private lastProcessedBlock: number = 0;
  private pollIntervalMs: number = 10000; // 10 seconds

  constructor() {
    const rpcUrl = process.env.BASE_RPC_HTTP || 'http://localhost:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS!;
    this.contract = new ethers.Contract(contractAddress, AGENT_DREAMS_ABI, this.provider);
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[ChainWatcher] Starting watcher service...');
    console.log(`[ChainWatcher] Connecting to ${process.env.ESCROW_CONTRACT_ADDRESS} on ${process.env.BASE_RPC_HTTP}`);

    try {
      // Basic connectivity check
      await this.provider.getNetwork();
      console.log('[ChainWatcher] Connected to network.');
      
      // Initialize lastProcessedBlock.
      // In production, checking the DB for the last synced block is better.
      // Here we start from current block to avoid re-processing old events on restart.
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      console.log(`[ChainWatcher] Starting poll from block ${this.lastProcessedBlock}`);
      
      // Start the polling loop without awaiting it (background task)
      this.pollLoop();
    } catch (error) {
      console.error('[ChainWatcher] Failed to connect to network. Watcher disabled.', error);
      this.isRunning = false;
    }
  }

  private async pollLoop() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          const fromBlock = this.lastProcessedBlock + 1;
          // Limit range if needed (some RPCs limit range size)
          // For now, assume we keep up or range is small enough
          await this.processEvents(fromBlock, currentBlock);
          this.lastProcessedBlock = currentBlock;
        }
      } catch (error) {
        console.error('[ChainWatcher] Error in poll loop:', error);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  private async processEvents(fromBlock: number, toBlock: number) {
    try {
        const [createdEvents, releasedEvents, refundedEvents] = await Promise.all([
            this.contract.queryFilter('TaskCreated', fromBlock, toBlock),
            this.contract.queryFilter('TaskReleased', fromBlock, toBlock),
            this.contract.queryFilter('TaskRefunded', fromBlock, toBlock)
        ]);
        
        const allEvents = [
            ...createdEvents,
            ...releasedEvents,
            ...refundedEvents
        ].sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
            return a.index - b.index;
        });

        for (const event of allEvents) {
            if (event instanceof ethers.EventLog) {
                await this.handleEvent(event);
            }
        }
    } catch (err) {
        console.error(`[ChainWatcher] Failed to query events from ${fromBlock} to ${toBlock}:`, err);
    }
  }

  private async handleEvent(event: ethers.EventLog) {
    const { name } = event.fragment;
    if (name === 'TaskCreated') {
        await this.handleTaskCreated(event);
    } else if (name === 'TaskReleased') {
        await this.handleTaskReleased(event);
    } else if (name === 'TaskRefunded') {
        await this.handleTaskRefunded(event);
    }
  }

  private async handleTaskCreated(event: ethers.EventLog) {
    const [taskIdBytes32, requester, payout, deadline] = event.args;
    console.log(`[ChainWatcher] TaskCreated detected: ${taskIdBytes32}`);
      
    try {
      const txHash = event.transactionHash;
      
      // Update Task status to OPEN
      const updateText = `
        UPDATE tasks 
        SET status = 'OPEN', escrow_tx_hash = $1, updated_at = NOW()
        WHERE task_id_bytes32 = $2 AND status = 'DRAFT'
        RETURNING id, requester_agent_id
      `;
      const { rows } = await query(updateText, [txHash, taskIdBytes32]);

      if (rows.length > 0) {
        const task = rows[0];
        await this.logEvent('task.created', task.id, task.requester_agent_id, {
          taskIdBytes32,
          requester,
          payout: payout.toString(),
          deadline: deadline.toString(),
          txHash
        });
        console.log(`[ChainWatcher] Task ${task.id} marked as OPEN.`);
      } else {
          console.warn(`[ChainWatcher] Task with bytes32 ${taskIdBytes32} not found or not in DRAFT.`);
      }
    } catch (err) {
      console.error('[ChainWatcher] Error processing TaskCreated:', err);
    }
  }

  private async handleTaskReleased(event: ethers.EventLog) {
    const [taskIdBytes32, worker, payout, resultHash] = event.args;
    console.log(`[ChainWatcher] TaskReleased detected: ${taskIdBytes32}`);
    try {
      const txHash = event.transactionHash;

      const updateText = `
        UPDATE tasks 
        SET status = 'PAID', release_tx_hash = $1, updated_at = NOW()
        WHERE task_id_bytes32 = $2
        RETURNING id, worker_agent_id
      `;
      const { rows } = await query(updateText, [txHash, taskIdBytes32]);

      if (rows.length > 0) {
        const task = rows[0];
        await this.logEvent('task.paid', task.id, task.worker_agent_id, {
          taskIdBytes32,
          worker,
          payout: payout.toString(),
          resultHash,
          txHash
        });
        console.log(`[ChainWatcher] Task ${task.id} marked as PAID.`);
      }
    } catch (err) {
      console.error('[ChainWatcher] Error processing TaskReleased:', err);
    }
  }

  private async handleTaskRefunded(event: ethers.EventLog) {
    const [taskIdBytes32, requester, payout] = event.args;
    console.log(`[ChainWatcher] TaskRefunded detected: ${taskIdBytes32}`);
    try {
        const txHash = event.transactionHash;

        const updateText = `
        UPDATE tasks 
        SET status = 'REFUNDED', refund_tx_hash = $1, updated_at = NOW()
        WHERE task_id_bytes32 = $2
        RETURNING id, requester_agent_id
        `;
        const { rows } = await query(updateText, [txHash, taskIdBytes32]);

        if (rows.length > 0) {
        const task = rows[0];
        await this.logEvent('task.refunded', task.id, task.requester_agent_id, {
            taskIdBytes32,
            requester,
            payout: payout.toString(),
            txHash
        });
        console.log(`[ChainWatcher] Task ${task.id} marked as REFUNDED.`);
        }
    } catch (err) {
        console.error('[ChainWatcher] Error processing TaskRefunded:', err);
    }
  }

  private async logEvent(type: string, taskId: string | null, actorId: string | null, data: any) {
    const text = `
      INSERT INTO event_stream (type, task_id, actor_agent_id, data_json)
      VALUES ($1, $2, $3, $4)
    `;
    await query(text, [type, taskId, actorId, JSON.stringify(data)]);
  }
}