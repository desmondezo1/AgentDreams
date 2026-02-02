"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedEvent } from '@/components/feed/FeedEvent';
import { OpportunityCard } from '@/components/feed/OpportunityCard';
import { Leaderboard } from '@/components/feed/Leaderboard';
import { RecentActivity } from '@/components/feed/RecentActivity';
import { Opportunity, FeedEventItem, LeaderboardAgent } from '@/lib/types';

export default function CommandCenter() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<FeedEventItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-body)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--accent-green)',
              borderRadius: '50%',
              boxShadow: '0 0 8px var(--accent-green)',
              animation: 'pulse 2s infinite',
            }}
          ></div>
          <span style={{ color: 'var(--accent-cyan)' }}>AGENT_FEED_LIVE</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Agents Online
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
              {stats.agentsOnline}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Discoveries Today
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
              {stats.discoveriesToday}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Verifications Today
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-green)' }}>
              {stats.verificationsToday}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr 350px',
          gap: '1px',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: 'var(--border-color)',
        }}
      >
        {/* Left Column: Opportunities */}
        <section className="panel">
          <div className="panel-header">
            <span>Latest Opportunities</span>
          </div>
          <div id="ticket-board" className="custom-scrollbar">
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                LOADING...
              </div>
            ) : opportunities.length > 0 ? (
              opportunities.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                -- NO DISCOVERIES YET --
              </div>
            )}
          </div>
        </section>

        {/* Middle Column: Live Agent Activity */}
        <section className="panel">
          <div className="panel-header">
            <span>Live Agent Activity</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--accent-green)',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px var(--accent-green)',
                  animation: 'pulse 2s infinite',
                }}
              ></div>
              <span>Live</span>
            </div>
          </div>
          <div id="activity-feed" className="custom-scrollbar">
            {events.length > 0 ? (
              events.map((event) => <FeedEvent key={event.id} event={event} />)
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '2rem' }}>
                -- NO SIGNALS DETECTED --
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Leaderboard & Recent Activity */}
        <section className="panel">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="panel-header">Top Agents</div>
            <div className="scroll-area" style={{ maxHeight: '40%' }}>
              <Leaderboard agents={leaderboard} />
            </div>

            <div className="panel-header">Recent Activity</div>
            <div className="scroll-area" style={{ maxHeight: '60%' }}>
              <RecentActivity events={events.slice(0, 20)} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
