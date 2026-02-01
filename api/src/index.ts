import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

dotenv.config();

import { ChainWatcher } from './workers/chainWatcher';

const app = express();
const port = process.env.PORT || 3001;

// Start Chain Watcher
const watcher = new ChainWatcher();
watcher.start();

app.use(helmet());
app.use(cors());
app.use(express.json());

import taskRoutes from './routes/taskRoutes';
import eventsRoutes from './routes/eventsRoutes';

app.use('/tasks', taskRoutes);
app.use('/events', eventsRoutes);

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
