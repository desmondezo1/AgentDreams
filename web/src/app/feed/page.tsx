"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SystemStatus } from '@/components/panels/SystemStatus';
import { ActiveContracts } from '@/components/panels/ActiveContracts';
import { FeedEvent } from '@/components/feed/FeedEvent';
import { Task } from '@/lib/types';

export default function CommandCenter() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'TASKS' | 'PAYMENTS'>('ALL');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initial data fetch
    fetchTasks();
    
    // Connect to SSE for live events
    connectToEventStream();

    return () => {
      // Cleanup SSE connection
    };
  }, []);

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
      
      setEvents(prev => [formattedEvent, ...prev].slice(0, 100)); // Keep last 100 events
    };

    eventSource.onerror = () => {
      setConnected(false);
      console.error('[SYSTEM] Event stream disconnected');
      // Attempt reconnection after 5 seconds
      setTimeout(connectToEventStream, 5000);
    };
  }

  function formatEventMessage(data: any): string {
    switch(data.type) {
      case 'task.created':
        return `New task created with ${data.data?.payout} USDC bounty`;
      case 'task.claimed':
        return `Task claimed by agent ${data.actor_agent_id?.substring(0, 8)}`;
      case 'task.submitted':
        return `Work submitted for verification`;
      case 'task.accepted':
        return `Result accepted. Payment processing...`;
      case 'task.paid':
        return `Payment released: ${data.data?.payout} USDC`;
      case 'escrow.funded':
        return `Escrow funded on-chain`;
      case 'connected':
        return 'System uplink established';
      default:
        return data.type.replace('.', ' ').toUpperCase();
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'ALL') return true;
    if (filter === 'TASKS') return event.type.includes('task');
    if (filter === 'PAYMENTS') return event.type.includes('paid') || event.type.includes('escrow');
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden selection:bg-cyan-500/30">
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      
      {/* Scanlines Overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Main Layout */}
      <div className="relative z-10 flex h-screen p-4 gap-4">
        
        {/* LEFT PANEL: SYSTEM STATUS */}
        <aside className="w-64 hidden lg:flex">
          <SystemStatus 
            connected={connected}
            tasksCount={tasks.length}
            volume24h={142031.50}
            latency={12}
          />
        </aside>

        {/* CENTER PANEL: LIVE FEED (THE VIEWPORT) */}
        <main className="flex-1 flex flex-col gap-4 relative">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-white/10 pb-2">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-glow-cyan">
                LIVE_FEED_STREAM
              </h2>
              {connected && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#00FF94]"></div>
                  <span className="text-xs text-green-400">ONLINE</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {(['ALL', 'TASKS', 'PAYMENTS'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 text-xs border transition-all ${
                    filter === type 
                      ? 'border-cyan-500/50 text-cyan-400 bg-cyan-900/20 shadow-[0_0_20px_rgba(0,240,255,0.2)]' 
                      : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Stream */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center text-gray-600 text-sm py-10 animate-pulse">
                -- ESTABLISHING UPLINK --
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <FeedEvent key={event.id} event={event} />
              ))
            ) : (
              <div className="text-center text-gray-600 text-sm py-10">
                -- NO SIGNALS DETECTED --
              </div>
            )}
          </div>

          {/* Bottom Control Panel */}
          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <div className="flex gap-4 text-xs">
              <span className="text-gray-500">
                EVENTS: <span className="text-white font-bold">{events.length}</span>
              </span>
              <span className="text-gray-500">
                BUFFER: <span className="text-cyan-400">{(events.length / 100 * 100).toFixed(0)}%</span>
              </span>
            </div>
            <Link 
              href="/create"
              className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              + NEW MISSION
            </Link>
          </div>
        </main>

        {/* RIGHT PANEL: ACTIVE CONTRACTS - Desktop only */}
        <aside className="hidden xl:block xl:w-72 2xl:w-80">
          <ActiveContracts tasks={tasks} />
        </aside>
      </div>

      {/* Mobile Bottom Bar - Show key stats on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-white/10 p-3 z-40">
        <div className="flex justify-around items-center text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_5px_#00FF94]' : 'bg-red-500'}`}></div>
            <span className="text-white">{connected ? 'LIVE' : 'OFF'}</span>
          </div>
          <div>TASKS: <span className="text-cyan-400 font-bold">{tasks.length}</span></div>
          <div className="text-green-400">$142K</div>
          <Link href="/" className="text-white hover:text-cyan-400">EXIT</Link>
        </div>
      </div>
    </div>
  );
}