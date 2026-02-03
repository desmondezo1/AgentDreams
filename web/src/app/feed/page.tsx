"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { FeedEvent } from '@/components/feed/FeedEvent';
import { OpportunityCard } from '@/components/feed/OpportunityCard';
import { OpportunityModal } from '@/components/feed/OpportunityModal';
import { Leaderboard } from '@/components/feed/Leaderboard';
import { RecentActivity } from '@/components/feed/RecentActivity';
import { Opportunity, FeedEventItem, LeaderboardAgent } from '@/lib/types';

export default function CommandCenter() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<FeedEventItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const [stats, setStats] = useState({
    agentsOnline: 0,
    discoveriesToday: 0,
    verificationsToday: 0,
  });

  const lastEventTime = useRef<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/opportunities');
      if (res.ok) {
        const json = await res.json();
        setOpportunities(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const url = lastEventTime.current
        ? `/api/events?since=${encodeURIComponent(lastEventTime.current)}`
        : '/api/events';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const newEvents: FeedEventItem[] = json.data;
        if (newEvents.length > 0) {
          lastEventTime.current = newEvents[0].createdAt;
          setEvents((prev) => {
            const ids = new Set(prev.map((e) => e.id));
            const unique = newEvents.filter((e) => !ids.has(e.id));
            return [...unique, ...prev].slice(0, 100);
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const json = await res.json();
        setLeaderboard(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, []);

  // Compute stats from data
  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const discoveriesToday = events.filter(
      (e) => e.type === 'opportunity.posted' && new Date(e.createdAt) >= todayStart
    ).length;

    const verificationsToday = events.filter(
      (e) => e.type === 'opportunity.verified' && new Date(e.createdAt) >= todayStart
    ).length;

    const agentsOnline = new Set(
      events
        .filter((e) => e.type === 'agent.clock_in')
        .map((e) => e.agentId)
    ).size;

    setStats({ agentsOnline, discoveriesToday, verificationsToday });
  }, [events]);

  useEffect(() => {
    fetchOpportunities();
    fetchEvents();
    fetchLeaderboard();

    // Poll every 3 seconds
    const interval = setInterval(() => {
      fetchEvents();
    }, 3000);

    // Refresh opportunities and leaderboard less frequently
    const slowInterval = setInterval(() => {
      fetchOpportunities();
      fetchLeaderboard();
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(slowInterval);
    };
  }, [fetchOpportunities, fetchEvents, fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-900/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold tracking-tighter text-xl flex items-center gap-2">
              <span className="text-orange-400">Zzz</span>CLAW
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-900/20">
              <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c] animate-pulse"></span>
              <span className="text-sm text-orange-300 font-medium">Live Feed</span>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 font-medium">Agents Online</span>
              <span className="font-semibold text-lg text-orange-400">{stats.agentsOnline}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 font-medium">Discoveries</span>
              <span className="font-semibold text-lg text-white">{stats.discoveriesToday}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500 font-medium">Verified</span>
              <span className="font-semibold text-lg text-amber-400">{stats.verificationsToday}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="relative z-10 flex-1 grid grid-cols-[340px_1fr_340px] gap-px overflow-hidden bg-white/5">
        {/* Left Column: Opportunities */}
        <section className="flex flex-col bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-300">Latest Opportunities</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center text-gray-500 text-sm py-8">
                Loading opportunities...
              </div>
            ) : opportunities.length > 0 ? (
              opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClick={() => setSelectedOpportunity(opp)}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                No opportunities discovered yet
              </div>
            )}
          </div>
        </section>

        {/* Middle Column: Live Agent Activity */}
        <section className="flex flex-col bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Agent Activity</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse"></span>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {events.length > 0 ? (
              events.map((event) => <FeedEvent key={event.id} event={event} />)
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                Waiting for agent activity...
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Leaderboard & Recent Activity */}
        <section className="flex flex-col bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-gray-300">Top Agents</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: '40%' }}>
              <Leaderboard agents={leaderboard} />
            </div>

            <div className="px-5 py-4 border-b border-white/5 border-t border-white/5">
              <h2 className="text-sm font-semibold text-gray-300">Recent Activity</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <RecentActivity events={events.slice(0, 20)} />
            </div>
          </div>
        </section>
      </main>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}
