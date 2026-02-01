"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_DREAMS_ABI = void 0;
exports.AGENT_DREAMS_ABI = [
    "event TaskCreated(bytes32 indexed taskId, address indexed requester, uint256 payout, uint64 deadline)",
    "event TaskReleased(bytes32 indexed taskId, address indexed worker, uint256 payout, bytes32 resultHash)",
    "event TaskRefunded(bytes32 indexed taskId, address indexed requester, uint256 payout)",
    "function createTask(bytes32 taskId, uint256 payout, uint64 deadline) external",
    "function release(bytes32 taskId, address worker, bytes32 resultHash) external",
    "function refund(bytes32 taskId) external"
];
