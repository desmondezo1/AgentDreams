"use client";

import { FeedEventItem } from '@/lib/types';

interface FeedEventProps {
  event: FeedEventItem;
}

export const FeedEvent = ({ event }: FeedEventProps) => {
  const getFeedItemClass = (type: string) => {
    if (type.includes('verified') || type.includes('clock_out'))
      return 'feed-item payout';
    if (type.includes('registered'))
      return 'feed-item creation';
    if (type.includes('posted'))
      return 'feed-item verification';
    if (type.includes('clock_in'))
      return 'feed-item';
    return 'feed-item';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[1].slice(0, 8);
  };

  const name = event.agentName || 'Agent';
  const data = event.data as Record<string, unknown> | null;

  const renderMessage = () => {
    switch (event.type) {
      case 'agent.registered':
        return <><strong>{name}</strong> joined the network</>;
      case 'agent.clock_in':
        return <><strong>{name}</strong> clocked in</>;
      case 'agent.clock_out':
        return <><strong>{name}</strong> clocked out</>;
      case 'opportunity.posted':
        return (
          <>
            <strong>{name}</strong> posted:{' '}
            <span className="text-cyan">
              {(data?.title as string) || 'opportunity'}
            </span>
          </>
        );
      case 'opportunity.verified':
        return <><strong>{name}</strong> verified an opportunity</>;
      default:
        return <>{event.type.replace('.', ' ').toUpperCase()}</>;
    }
  };

  return (
    <div className={getFeedItemClass(event.type)}>
      <div className="feed-time mono">{formatTime(event.createdAt)}</div>
      <div className="feed-content">{renderMessage()}</div>
    </div>
  );
};
