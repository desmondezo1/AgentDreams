/**
 * Simple in-memory database for development/testing
 * Replace with real Postgres for production
 */

interface Task {
  id: string;
  task_id_bytes32: string;
  requester_agent_id?: string;
  requester_wallet: string;
  worker_agent_id?: string;
  worker_wallet?: string;
  title: string;
  spec: string;
  payload_ref?: string;
  payout_usdc: string;
  deadline_at: string;
  verification_mode: string;
  verifier_type?: string;
  validator_n?: number;
  validator_threshold?: number;
  validator_fee_total_usdc?: string;
  status: string;
  escrow_tx_hash?: string;
  release_tx_hash?: string;
  refund_tx_hash?: string;
  result_hash?: string;
  created_at: string;
  updated_at: string;
}

interface EventStream {
  id: number;
  type: string;
  task_id?: string;
  actor_agent_id?: string;
  data_json: any;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  worker_agent_id?: string;
  result_ref: string;
  submission_hash: string;
  submitted_at: string;
}

interface Receipt {
  id: string;
  task_id: string;
  type: string;
  payload_json: any;
  signature: string;
  created_at: string;
}

class MemoryDatabase {
  private tasks: Map<string, Task> = new Map();
  private events: EventStream[] = [];
  private submissions: Map<string, Submission[]> = new Map();
  private receipts: Map<string, Receipt[]> = new Map();
  private eventIdCounter = 1;

  constructor() {
    // Seed with demo events for a lively feed
    this.seedDemoEvents();
  }

  private seedDemoEvents() {
    const agentNames = ['AlphaNode', 'BetaBot', 'CryptoSolver', 'NeuralNet_7', 'DataMiner_X',
                        'LogicGate', 'QuantumLeap', 'SwiftAgent', 'HashHunter', 'ChainLinker'];
    const taskNames = ['Oracle Update', 'Image Classification', 'API Rate Limit Test',
                       'Compression Task', 'Data Verification', 'Sentiment Analysis',
                       'Pattern Recognition', 'Cache Optimization'];

    // Start demo events at a high ID to avoid conflicts with real events
    const demoStartId = 1000000;

    const demoEvents = [
      {
        type: 'task.paid',
        task_id: 'demo-1',
        actor_agent_id: agentNames[8], // HashHunter
        data_json: JSON.stringify({
          title: taskNames[0], // Oracle Update
          payout: '27.57',
          payout_usdc: '27.57'
        })
      },
      {
        type: 'task.created',
        task_id: 'demo-2',
        actor_agent_id: undefined,
        data_json: JSON.stringify({
          title: taskNames[4], // Data Verification
          payout: '39.57',
          payout_usdc: '39.57'
        })
      },
      {
        type: 'task.claimed',
        task_id: 'demo-3',
        actor_agent_id: agentNames[0], // AlphaNode
        data_json: JSON.stringify({
          title: taskNames[3] // Compression Task
        })
      },
      {
        type: 'task.paid',
        task_id: 'demo-4',
        actor_agent_id: agentNames[7], // SwiftAgent
        data_json: JSON.stringify({
          title: taskNames[1], // Image Classification
          payout: '48.18',
          payout_usdc: '48.18'
        })
      }
    ];

    // Add demo events with timestamps spread over the last few minutes
    const now = Date.now();
    demoEvents.forEach((event, index) => {
      const timestamp = new Date(now - (demoEvents.length - index) * 60000).toISOString();
      this.events.push({
        id: demoStartId + index,
        type: event.type,
        task_id: event.task_id,
        actor_agent_id: event.actor_agent_id,
        data_json: event.data_json,
        created_at: timestamp
      });
    });

    // Set counter to start after demo events
    this.eventIdCounter = demoStartId + demoEvents.length + 1;
  }

  // Query helper to mimic pg query API
  async query(text: string, params?: any[]): Promise<{ rows: any[] }> {
    try {
      // Parse the SQL-like query and execute appropriate operation
      const normalizedText = text.trim().toLowerCase();

      if (normalizedText.startsWith('insert into tasks')) {
        return this.insertTask(params);
      } else if (normalizedText.startsWith('select * from tasks where id')) {
        return this.selectTaskById(params);
      } else if (normalizedText.startsWith('select * from tasks')) {
        return this.selectTasks(normalizedText, params);
      } else if (normalizedText.startsWith('update tasks')) {
        return this.updateTask(normalizedText, params);
      } else if (normalizedText.startsWith('insert into event_stream')) {
        return this.insertEvent(params);
      } else if (normalizedText.startsWith('select * from event_stream')) {
        return this.selectEvents(params);
      } else if (normalizedText.startsWith('insert into submissions')) {
        return this.insertSubmission(params);
      } else if (normalizedText.includes('join submissions')) {
        return this.selectTaskWithSubmission(params);
      } else if (normalizedText.startsWith('insert into receipts')) {
        return this.insertReceipt(params);
      } else if (normalizedText.startsWith('select payload_ref')) {
        return this.selectPayload(params);
      }

      // Default empty result
      return { rows: [] };
    } catch (error) {
      console.error('[MemoryDB] Query error:', error);
      throw error;
    }
  }

  private insertTask(params: any[] = []): { rows: Task[] } {
    const task: Task = {
      id: params[0],
      task_id_bytes32: params[1],
      title: params[2],
      spec: params[3],
      payload_ref: params[4],
      payout_usdc: String(params[5]), // Ensure it's always a string
      deadline_at: params[6],
      verification_mode: params[7],
      verifier_type: params[8],
      validator_n: params[9],
      validator_threshold: params[10],
      validator_fee_total_usdc: params[11],
      requester_wallet: params[12],
      status: 'OPEN', // Changed from DRAFT to OPEN
      escrow_tx_hash: params[13],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[MemoryDB] Inserting task:', { id: task.id, title: task.title, payout: task.payout_usdc, type: typeof task.payout_usdc, status: task.status });

    this.tasks.set(task.id, task);
    return { rows: [task] };
  }

  private selectTaskById(params: any[] = []): { rows: Task[] } {
    const task = this.tasks.get(params[0]);
    return { rows: task ? [task] : [] };
  }

  private selectTasks(query: string, params: any[] = []): { rows: Task[] } {
    let tasks = Array.from(this.tasks.values());

    // Parse filters from query
    if (query.includes('status =') && params[0]) {
      tasks = tasks.filter(t => t.status === params[0]);
    }
    if (query.includes('verification_mode =')) {
      const modeIndex = query.includes('status =') ? 1 : 0;
      if (params[modeIndex]) {
        tasks = tasks.filter(t => t.verification_mode === params[modeIndex]);
      }
    }

    // Sort by created_at DESC
    tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit
    return { rows: tasks.slice(0, 50) };
  }

  private updateTask(query: string, params: any[] = []): { rows: Task[] } {
    // Parse different update patterns
    const taskId = params[params.length - 1]; // Last param is usually the ID
    const task = this.tasks.get(taskId);

    if (!task) {
      return { rows: [] };
    }

    // Check status condition if exists
    if (query.includes('and status =')) {
      const expectedStatus = query.includes("'draft'") ? 'DRAFT' :
                           query.includes("'open'") ? 'OPEN' :
                           query.includes("'claimed'") ? 'CLAIMED' :
                           query.includes("'submitted'") ? 'SUBMITTED' : null;

      if (expectedStatus && task.status !== expectedStatus) {
        return { rows: [] };
      }
    }

    // Apply updates based on query content
    if (query.includes('status =')) {
      const status = query.includes("'open'") ? 'OPEN' :
                    query.includes("'claimed'") ? 'CLAIMED' :
                    query.includes("'submitted'") ? 'SUBMITTED' :
                    query.includes("'accepted'") ? 'ACCEPTED' :
                    query.includes("'rejected'") ? 'REJECTED' :
                    query.includes("'paid'") ? 'PAID' :
                    query.includes("'refunded'") ? 'REFUNDED' : task.status;
      task.status = status;
    }

    if (query.includes('escrow_tx_hash')) {
      task.escrow_tx_hash = params[0];
    }
    if (query.includes('release_tx_hash')) {
      task.release_tx_hash = query.includes('result_hash') ? params[2] : params[0];
    }
    if (query.includes('refund_tx_hash')) {
      task.refund_tx_hash = params[0];
    }
    if (query.includes('worker_wallet')) {
      task.worker_wallet = params[0];
      task.worker_agent_id = params[1];
    }
    if (query.includes('result_hash')) {
      task.result_hash = params[0];
    }

    task.updated_at = new Date().toISOString();
    this.tasks.set(taskId, task);

    return { rows: [task] };
  }

  private insertEvent(params: any[] = []): { rows: any[] } {
    const event: EventStream = {
      id: this.eventIdCounter++,
      type: params[0],
      task_id: params[1],
      actor_agent_id: params[2],
      data_json: params[3],
      created_at: new Date().toISOString(),
    };
    this.events.push(event);
    return { rows: [event] };
  }

  private selectEvents(params: any[] = []): { rows: EventStream[] } {
    if (params && params[0]) {
      // Filter by task_id
      const filtered = this.events.filter(e => e.task_id === params[0]);
      return { rows: filtered };
    }
    // Return all events
    return { rows: [...this.events].reverse() };
  }

  private insertSubmission(params: any[] = []): { rows: any[] } {
    const submission: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      task_id: params[0],
      worker_agent_id: params[1],
      result_ref: params[2],
      submission_hash: params[3],
      submitted_at: new Date().toISOString(),
    };

    const taskSubmissions = this.submissions.get(params[0]) || [];
    taskSubmissions.push(submission);
    this.submissions.set(params[0], taskSubmissions);

    return { rows: [submission] };
  }

  private selectTaskWithSubmission(params: any[] = []): { rows: any[] } {
    const task = this.tasks.get(params[0]);
    if (!task) return { rows: [] };

    const submissions = this.submissions.get(params[0]) || [];
    const latestSubmission = submissions[submissions.length - 1];

    return {
      rows: [{
        ...task,
        submission_hash: latestSubmission?.submission_hash,
      }],
    };
  }

  private insertReceipt(params: any[] = []): { rows: any[] } {
    const receipt: Receipt = {
      id: Math.random().toString(36).substr(2, 9),
      task_id: params[0],
      type: params[1],
      payload_json: params[2],
      signature: params[3],
      created_at: new Date().toISOString(),
    };

    const taskReceipts = this.receipts.get(params[0]) || [];
    taskReceipts.push(receipt);
    this.receipts.set(params[0], taskReceipts);

    return { rows: [receipt] };
  }

  private selectPayload(params: any[] = []): { rows: any[] } {
    const task = this.tasks.get(params[0]);
    return {
      rows: task ? [{ payload_ref: task.payload_ref }] : [],
    };
  }

  // Additional helper for getting all events (SSE)
  getAllEvents(): EventStream[] {
    return [...this.events];
  }

  // Client connection helper (for compatibility with pg)
  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  }
}

// Export singleton instance
const db = new MemoryDatabase();

export const query = (text: string, params?: any[]) => db.query(text, params);
export const getClient = () => db.connect();
export const getAllEvents = () => db.getAllEvents();

export default db;
