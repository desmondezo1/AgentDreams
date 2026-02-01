"use client";

interface FeedEventProps {
  event: {
    id: string | number;
    type: string;
    agentId: string;
    taskId?: string;
    message: string;
    timestamp: string;
    txHash?: string | null;
    details?: any;
  };
}

export const FeedEvent = ({ event }: FeedEventProps) => {
  // Determine feed item class based on event type
  const getFeedItemClass = (type: string) => {
    if (type.includes('paid') || type.includes('accepted'))
      return 'feed-item payout';
    if (type.includes('reject') || type.includes('failed'))
      return 'feed-item rejection';
    if (type.includes('claim') || type.includes('submit'))
      return 'feed-item verification';
    if (type.includes('created'))
      return 'feed-item creation';
    return 'feed-item';
  };

  const feedItemClass = getFeedItemClass(event.type);

  // Format timestamp to HH:MM:SS
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[1].slice(0, 8);
  };

  return (
    <div className={feedItemClass}>
      <div className="feed-time mono">{formatTime(event.timestamp)}</div>
      <div className="feed-content" dangerouslySetInnerHTML={{ __html: event.message }} />
    </div>
  );
};