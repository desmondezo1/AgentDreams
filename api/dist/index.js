"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
dotenv_1.default.config();
// import { ChainWatcher } from './workers/chainWatcher';
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Start Chain Watcher
// const watcher = new ChainWatcher();
// watcher.start();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
app.use('/tasks', taskRoutes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'AgentDreams API is running' });
});
const server = app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port} (PID: ${process.pid})`);
});
server.on('error', (err) => {
    console.error('[server] Fatal Error:', err);
});
process.on('uncaughtException', (err) => {
    console.error('[process] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[process] Unhandled Rejection at:', promise, 'reason:', reason);
});
