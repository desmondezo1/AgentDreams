import { Router } from 'express';
import { query } from '../db';

const router = Router();

// SSE endpoint for real-time events
router.get('/', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to event stream' })}\n\n`);
  
  // Get initial cursor (latest event id)
  const { rows: latestEvent } = await query(
    'SELECT MAX(id) as max_id FROM event_stream'
  );
  let lastEventId = latestEvent[0]?.max_id || 0;
  
  // Poll for new events every 2 seconds
  const interval = setInterval(async () => {
    try {
      const { rows: newEvents } = await query(
        'SELECT * FROM event_stream WHERE id > $1 ORDER BY id ASC LIMIT 10',
        [lastEventId]
      );
      
      for (const event of newEvents) {
        const eventData = {
          id: event.id,
          type: event.type,
          task_id: event.task_id,
          actor_agent_id: event.actor_agent_id,
          data: event.data_json,
          created_at: event.created_at
        };
        
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        lastEventId = event.id;
      }
    } catch (error) {
      console.error('Error polling events:', error);
    }
  }, 2000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;