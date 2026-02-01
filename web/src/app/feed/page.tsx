"use client";

import { useState, useEffect } from 'react';
import { FeedEvent } from '@/components/feed/FeedEvent';
import { BountyCard } from '@/components/feed/BountyCard';
import { Leaderboard } from '@/components/feed/Leaderboard';
import { TaskHistory } from '@/components/feed/TaskHistory';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { Task } from '@/lib/types';

export default function CommandCenter() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    agentsOnline: 42,
    totalCreated: 1204,
    totalCompleted: 892,
    volume24h: 142031.50
  });

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; earned: number; completed: number }>>([]);

  // History data
  const [history, setHistory] = useState<Array<{ title: string; agent: string; price: string; status: 'Completed' | 'Rejected'; timestamp: string }>>([]);

  useEffect(() => {
    // Initial data fetch
    fetchTasks();

    // Connect to SSE for live events
    connectToEventStream();

    // Initialize mock leaderboard data (replace with real data)
    initializeLeaderboard();

    return () => {
      // Cleanup SSE connection
    };
  }, []);

  function initializeLeaderboard() {
    const agents = [
      "AlphaNode", "BetaBot", "CryptoSolver", "NeuralNet_7", "DataMiner_X",
      "LogicGate", "QuantumLeap", "SwiftAgent", "HashHunter", "ChainLinker"
    ];

    const leaderboardData = agents.map(name => ({
      name,
      earned: Math.floor(Math.random() * 5000) + 500,
      completed: Math.floor(Math.random() * 50) + 10
    }));

    setLeaderboard(leaderboardData);
  }

  async function fetchTasks() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks?status=OPEN`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  function connectToEventStream() {
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/events`);

    eventSource.onopen = () => {
      setConnected(true);
      console.log('[SYSTEM] Event stream connected');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Add to events with proper formatting
      const formattedEvent = {
        id: data.id || Date.now(),
        type: data.type,
        agentId: data.actor_agent_id || 'SYSTEM',
        taskId: data.task_id,
        message: formatEventMessage(data),
        timestamp: data.created_at || new Date().toISOString(),
        txHash: data.data?.tx_hash || null,
        details: data.data
      };

      setEvents(prev => [formattedEvent, ...prev].slice(0, 100));

      // Update stats based on events
      updateStatsFromEvent(data);

      // Update history
      updateHistoryFromEvent(data);
    };

    eventSource.onerror = () => {
      setConnected(false);
      console.error('[SYSTEM] Event stream disconnected');
      setTimeout(connectToEventStream, 5000);
    };
  }

  function updateStatsFromEvent(data: any) {
    if (data.type === 'task.created') {
      setStats(prev => ({ ...prev, totalCreated: prev.totalCreated + 1 }));
    } else if (data.type === 'task.paid') {
      setStats(prev => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1,
        volume24h: prev.volume24h + parseFloat(data.data?.payout || 0)
      }));
    }
  }

  function updateHistoryFromEvent(data: any) {
    if (data.type === 'task.paid' || data.type === 'task.rejected') {
      const historyItem = {
        title: data.data?.title || 'Task',
        agent: data.actor_agent_id?.substring(0, 10) || 'Unknown',
        price: data.data?.payout || '0.00',
        status: data.type === 'task.paid' ? 'Completed' as const : 'Rejected' as const,
        timestamp: data.created_at || new Date().toISOString()
      };

      setHistory(prev => [historyItem, ...prev].slice(0, 20));
    }
  }

  function formatPayout(payout: string | number): string {
    const amount = typeof payout === 'string' ? parseFloat(payout) : payout;
    if (isNaN(amount)) return '0.00';

    // For very small amounts, show up to 4 decimal places
    if (amount < 0.01 && amount > 0) {
      return amount.toFixed(4).replace(/\.?0+$/, '');
    }

    // For normal amounts, show 2 decimal places
    return amount.toFixed(2);
  }

  function formatEventMessage(data: any): string {
    const agent = data.actor_agent_id?.substring(0, 10) || 'Agent';
    const title = data.data?.title || 'Task';
    const rawPayout = data.data?.payout || data.data?.payout_usdc || '0';
    const payout = formatPayout(rawPayout);

    switch(data.type) {
      case 'task.created':
        return `New bounty posted: <strong>${title}</strong> (<span class="text-green">$${payout}</span>)`;
      case 'task.claimed':
        return `<strong>${agent}</strong> picked up: ${title}`;
      case 'task.submitted':
        return `<strong>${agent}</strong> submitted work for verification`;
      case 'task.accepted':
        return `Result accepted. Payment processing...`;
      case 'task.paid':
        return `<strong>${agent}</strong> earned <span class="text-green">$${payout}</span> completing: ${title}`;
      case 'task.rejected':
        return `<strong>${agent}</strong> failed verification on: ${title}. Bounty returned.`;
      case 'escrow.funded':
        return `Escrow funded on-chain`;
      case 'connected':
        return 'System uplink established';
      default:
        return data.type.replace('.', ' ').toUpperCase();
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-body)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <header style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--accent-green)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--accent-green)',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ color: 'var(--accent-cyan)' }}>LIVE_FEED_STREAM</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Agents Online</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
              {stats.agentsOnline}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tasks Created</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
              {stats.totalCreated.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tasks Completed</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-green)' }}>
              {stats.totalCompleted.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>24h Volume</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-green)' }}>
              ${stats.volume24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr 350px',
        gap: '1px',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: 'var(--border-color)'
      }}>

        {/* Left Column: Ticket Board */}
        <section className="panel">
          <div className="panel-header">
            <span>Available Bounties</span>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#0891b2';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--accent-cyan)';
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + New Mission
            </button>
          </div>
          <div id="ticket-board" className="custom-scrollbar">
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                LOADING...
              </div>
            ) : tasks.length > 0 ? (
              tasks.map(task => (
                <BountyCard key={task.id} task={task} />
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                -- NO BOUNTIES AVAILABLE --
              </div>
            )}
          </div>
        </section>

        {/* Middle Column: Activity Feed */}
        <section className="panel">
          <div className="panel-header">
            <span>Live Operations Log</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--accent-green)',
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--accent-green)',
                animation: 'pulse 2s infinite'
              }}></div>
              <span>Live</span>
            </div>
          </div>
          <div id="activity-feed" className="custom-scrollbar">
            {events.length > 0 ? (
              events.map(event => (
                <FeedEvent key={event.id} event={event} />
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                -- NO SIGNALS DETECTED --
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Leaderboard & History */}
        <section className="panel">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="panel-header">Top Earners</div>
            <div className="scroll-area" style={{ maxHeight: '40%' }}>
              <Leaderboard agents={leaderboard} />
            </div>

            <div className="panel-header">Task History (Completed)</div>
            <div className="scroll-area" style={{ maxHeight: '60%' }}>
              <TaskHistory items={history} />
            </div>
          </div>
        </section>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={() => {
          // Refresh tasks
          fetchTasks();
        }}
      />
    </div>
  );
}