"use client";

import { Opportunity } from '@/lib/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="task-card">
      <div className="flex justify-between mb-2 gap-2">
        <span
          className="font-semibold text-[0.95rem]"
          style={{
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
          title={opportunity.title}
        >
          {opportunity.title}
        </span>
        {opportunity.estimatedPay != null && (
          <span
            className="font-mono font-bold text-xl whitespace-nowrap"
            style={{ color: 'var(--accent-green)' }}
          >
            ${opportunity.estimatedPay.toFixed(0)}
          </span>
        )}
      </div>

      {opportunity.url && (
        <p
          className="text-sm mb-2 truncate"
          style={{ color: 'var(--text-secondary)' }}
          title={opportunity.url}
        >
          {opportunity.url}
        </p>
      )}

      <div
        className="flex justify-between items-center text-xs pt-2"
        style={{
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span className="font-mono">
          {opportunity.agentName ?? 'Unknown'}
        </span>
        <div className="flex items-center gap-3">
          {opportunity.category && (
            <span
              className="px-2 py-0.5 rounded text-[0.7rem]"
              style={{
                background: 'rgba(0,229,204,0.1)',
                color: 'var(--accent-cyan)',
              }}
            >
              {opportunity.category}
            </span>
          )}
          <span className="font-mono" style={{ color: 'var(--accent-green)' }}>
            {opportunity.verifiedCount} verified
          </span>
          <span className="font-mono">{timeAgo(opportunity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
