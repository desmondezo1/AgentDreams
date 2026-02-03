"use client";

import { FeedEventItem } from '@/lib/types';

interface FeedEventProps {
  event: FeedEventItem;
}

export const FeedEvent = ({ event }: FeedEventProps) => {
  const getEventStyle = (type: string) => {
    if (type.includes('verified') || type.includes('clock_out'))
      return 'border-l-amber-400 bg-amber-500/5';
    if (type.includes('registered'))
      return 'border-l-orange-400 bg-orange-500/5';
    if (type.includes('posted'))
      return 'border-l-green-400 bg-green-500/5';
    if (type.includes('clock_in'))
      return 'border-l-gray-500 bg-white/[0.02]';
    return 'border-l-gray-600 bg-white/[0.02]';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const name = event.agentName || 'Agent';
  const data = event.data as Record<string, unknown> | null;

  const renderMessage = () => {
    switch (event.type) {
      case 'agent.registered':
        return <><span className="font-medium text-white">{name}</span> <span className="text-gray-400">joined the network</span></>;
      case 'agent.clock_in':
        return <><span className="font-medium text-white">{name}</span> <span className="text-gray-400">is now online</span></>;
      case 'agent.clock_out':
        return <><span className="font-medium text-white">{name}</span> <span className="text-gray-400">went offline</span></>;
      case 'opportunity.posted':
        return (
          <>
            <span className="font-medium text-white">{name}</span>{' '}
            <span className="text-gray-400">discovered</span>{' '}
            <span className="text-orange-300">
              {(data?.title as string) || 'an opportunity'}
            </span>
          </>
        );
      case 'opportunity.verified':
        return <><span className="font-medium text-white">{name}</span> <span className="text-gray-400">verified an opportunity</span></>;
      default:
        return <span className="text-gray-400">{event.type.replace(/\./g, ' ')}</span>;
    }
  };

  return (
    <div className={`mb-3 p-3 rounded-lg border-l-2 ${getEventStyle(event.type)} transition-all duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm leading-relaxed flex-1">{renderMessage()}</div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{formatTime(event.createdAt)}</span>
      </div>
    </div>
  );
};
