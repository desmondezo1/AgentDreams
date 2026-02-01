"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainWatcher = void 0;
const ethers_1 = require("ethers");
const db_1 = require("../db");
const abi_1 = require("../utils/abi");
class ChainWatcher {
    constructor() {
        this.isRunning = false;
        // In production, use a reliable RPC provider (Alchemy/Infura)
        // For local dev, if you don't have a local chain running, this will fail.
        // We'll wrap it in try/catch to avoid crashing the server if RPC is down.
        const rpcUrl = process.env.BASE_RPC_HTTP || 'http://localhost:8545';
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
        this.contract = new ethers_1.ethers.Contract(contractAddress, abi_1.AGENT_DREAMS_ABI, this.provider);
    }
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('[ChainWatcher] Starting watcher service...');
        console.log(`[ChainWatcher] Connecting to ${process.env.ESCROW_CONTRACT_ADDRESS} on ${process.env.BASE_RPC_HTTP}`);
        try {
            // Basic connectivity check
            await this.provider.getNetwork();
            console.log('[ChainWatcher] Connected to network.');
            this.setupListeners();
        }
        catch (error) {
            console.error('[ChainWatcher] Failed to connect to network. Watcher disabled.', error);
            this.isRunning = false;
        }
    }
    setupListeners() {
        // 1. TaskCreated
        this.contract.on('TaskCreated', async (taskIdBytes32, requester, payout, deadline, event) => {
            console.log(`[ChainWatcher] TaskCreated detected: ${taskIdBytes32}`);
            try {
                const txHash = event.log.transactionHash;
                // Update Task status to OPEN
                const updateText = `
          UPDATE tasks 
          SET status = 'OPEN', escrow_tx_hash = $1, updated_at = NOW()
          WHERE task_id_bytes32 = $2 AND status = 'DRAFT'
          RETURNING id, requester_agent_id
        `;
                const { rows } = await (0, db_1.query)(updateText, [txHash, taskIdBytes32]);
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
                }
                else {
                    console.warn(`[ChainWatcher] Task with bytes32 ${taskIdBytes32} not found or not in DRAFT.`);
                }
            }
            catch (err) {
                console.error('[ChainWatcher] Error processing TaskCreated:', err);
            }
        });
        // 2. TaskReleased
        this.contract.on('TaskReleased', async (taskIdBytes32, worker, payout, resultHash, event) => {
            console.log(`[ChainWatcher] TaskReleased detected: ${taskIdBytes32}`);
            try {
                const txHash = event.log.transactionHash;
                const updateText = `
          UPDATE tasks 
          SET status = 'PAID', release_tx_hash = $1, updated_at = NOW()
          WHERE task_id_bytes32 = $2
          RETURNING id, worker_agent_id
        `;
                const { rows } = await (0, db_1.query)(updateText, [txHash, taskIdBytes32]);
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
            }
            catch (err) {
                console.error('[ChainWatcher] Error processing TaskReleased:', err);
            }
        });
        // 3. TaskRefunded
        this.contract.on('TaskRefunded', async (taskIdBytes32, requester, payout, event) => {
            console.log(`[ChainWatcher] TaskRefunded detected: ${taskIdBytes32}`);
            try {
                const txHash = event.log.transactionHash;
                const updateText = `
            UPDATE tasks 
            SET status = 'REFUNDED', refund_tx_hash = $1, updated_at = NOW()
            WHERE task_id_bytes32 = $2
            RETURNING id, requester_agent_id
          `;
                const { rows } = await (0, db_1.query)(updateText, [txHash, taskIdBytes32]);
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
            }
            catch (err) {
                console.error('[ChainWatcher] Error processing TaskRefunded:', err);
            }
        });
    }
    async logEvent(type, taskId, actorId, data) {
        const text = `
      INSERT INTO event_stream (type, task_id, actor_agent_id, data_json)
      VALUES ($1, $2, $3, $4)
    `;
        await (0, db_1.query)(text, [type, taskId, actorId, JSON.stringify(data)]);
    }
}
exports.ChainWatcher = ChainWatcher;
