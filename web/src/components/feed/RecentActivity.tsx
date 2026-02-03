"use client";

import { FeedEventItem } from '@/lib/types';

interface RecentActivityProps {
  events: FeedEventItem[];
}

export const RecentActivity = ({ events }: RecentActivityProps) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'agent.registered': return 'Joined';
      case 'agent.clock_in': return 'Online';
      case 'agent.clock_out': return 'Offline';
      case 'opportunity.posted': return 'Discovery';
      case 'opportunity.verified': return 'Verified';
      default: return type.replace(/\./g, ' ');
    }
  };

  const getTypeStyle = (type: string) => {
    if (type.includes('registered')) return 'text-orange-400 bg-orange-500/10';
    if (type.includes('posted')) return 'text-green-400 bg-green-500/10';
    if (type.includes('verified')) return 'text-amber-400 bg-amber-500/10';
    if (type.includes('clock_in')) return 'text-gray-400 bg-white/5';
    if (type.includes('clock_out')) return 'text-gray-500 bg-white/5';
    return 'text-gray-400 bg-white/5';
  };

  return (
    <div className="px-4 pb-4">
      {events.length > 0 ? (
        events.map((event) => (
          <div
            key={event.id}
            className="py-3 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-white font-medium truncate">
                  {event.agentName || 'Agent'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${getTypeStyle(event.type)}`}>
                  {typeLabel(event.type)}
                </span>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {timeAgo(event.createdAt)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">
          No recent activity
        </div>
      )}
    </div>
  );
};
