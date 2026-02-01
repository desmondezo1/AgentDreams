"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskById = exports.getTasks = exports.createTask = void 0;
const db_1 = require("../db");
const contract_1 = require("../utils/contract");
const createTask = async (req, res) => {
    try {
        const { title, spec, payload, payout_usdc, deadline_at, // ISO string
        verification_mode, verifier_type, validators, requester_wallet } = req.body;
        // TODO: Add strict validation (zod or manual)
        // 1. Generate IDs
        // We let Postgres generate the UUID, so we insert and return it first? 
        // Or generate in JS. Generating in JS is easier for bytes32 derivation before insert.
        // Actually, let's use a postgres function or just fetch `uuid_generate_v4()` first?
        // Or just use `crypto.randomUUID()` in Node.
        // Using node crypto for UUID to ensure we have it for bytes32 derivation
        const crypto = require('crypto');
        const taskId = crypto.randomUUID();
        const taskIdBytes32 = (0, contract_1.toBytes32)(taskId);
        const deadlineTimestamp = Math.floor(new Date(deadline_at).getTime() / 1000);
        // 2. Insert into DB
        const text = `
      INSERT INTO tasks (
        id, task_id_bytes32, title, spec, payload_ref, 
        payout_usdc, deadline_at, verification_mode, 
        verifier_type, validator_n, validator_threshold, 
        validator_fee_total_usdc, status, requester_wallet
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, 
        $9, $10, $11, 
        $12, 'DRAFT', $13
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
            requester_wallet // "0x..."
        ];
        const { rows } = await (0, db_1.query)(text, values);
        const task = rows[0];
        // 3. Generate Escrow Instructions
        const instructions = (0, contract_1.getEscrowInstructions)(taskIdBytes32, payout_usdc, deadlineTimestamp, process.env.ESCROW_CONTRACT_ADDRESS, process.env.USDC_ADDRESS);
        res.status(201).json({
            task_id: task.id,
            task_id_bytes32: task.task_id_bytes32,
            escrow_instructions: instructions,
            task
        });
    }
    catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const { status, mode } = req.query;
        let text = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];
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
        const { rows } = await (0, db_1.query)(text, params);
        res.json(rows);
    }
    catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await (0, db_1.query)('SELECT * FROM tasks WHERE id = $1', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('Get Task Error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
};
exports.getTaskById = getTaskById;
