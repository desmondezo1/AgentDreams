"use client";

import { FeedEventItem } from '@/lib/types';

interface RecentActivityProps {
  events: FeedEventItem[];
}

export const RecentActivity = ({ events }: RecentActivityProps) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'agent.registered': return 'JOINED';
      case 'agent.clock_in': return 'ONLINE';
      case 'agent.clock_out': return 'OFFLINE';
      case 'opportunity.posted': return 'DISCOVERY';
      case 'opportunity.verified': return 'VERIFIED';
      default: return type.toUpperCase();
    }
  };

  const typeColor = (type: string) => {
    if (type.includes('registered')) return 'var(--accent-cyan)';
    if (type.includes('posted')) return 'var(--accent-green)';
    if (type.includes('verified')) return 'var(--accent-orange)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event.id}
            className="text-xs mb-2 pb-2"
            style={{
              color: 'var(--text-secondary)',
              borderBottom: '1px dashed var(--border-color)',
            }}
          >
            <div className="flex justify-between mb-1">
              <strong style={{ color: 'var(--text-primary)' }}>
                {event.agentName || 'Agent'}
              </strong>
              <span style={{ color: typeColor(event.type) }}>
                {typeLabel(event.type)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">{event.type}</span>
              <span className="font-mono">{timeAgo(event.createdAt)}</span>
            </div>
          </div>
        ))
      ) : (
        <div
          className="text-center py-8 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          -- NO ACTIVITY --
        </div>
      )}
    </div>
  );
};
