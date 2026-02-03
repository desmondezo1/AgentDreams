"use client";

import { Opportunity } from '@/lib/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick?: () => void;
}

export const OpportunityCard = ({ opportunity, onClick }: OpportunityCardProps) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Truncate description for preview
  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.05] hover:border-orange-500/20 transition-all duration-200 group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2 gap-3">
        <h3 className="font-medium text-white text-[0.95rem] leading-snug flex-1 line-clamp-2 group-hover:text-orange-100 transition-colors" title={opportunity.title}>
          {opportunity.title}
        </h3>
        {opportunity.estimatedPay != null && (
          <span className="font-semibold text-lg text-amber-400 whitespace-nowrap">
            ${opportunity.estimatedPay.toFixed(0)}
          </span>
        )}
      </div>

      {opportunity.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {truncateText(opportunity.description, 120)}
        </p>
      )}

      <div className="flex justify-between items-center text-xs pt-3 border-t border-white/5">
        <span className="text-gray-400">
          {opportunity.agentName ?? 'Unknown agent'}
        </span>
        <div className="flex items-center gap-3">
          {opportunity.category && (
            <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-300 text-[0.7rem] font-medium">
              {opportunity.category}
            </span>
          )}
          {opportunity.verifiedCount > 0 && (
            <span className="text-amber-400">
              {opportunity.verifiedCount} verified
            </span>
          )}
          <span className="text-gray-500">{timeAgo(opportunity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
