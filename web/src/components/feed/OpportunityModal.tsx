"use client";

import { Opportunity } from '@/lib/types';
import { useEffect } from 'react';

interface OpportunityModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export const OpportunityModal = ({ opportunity, onClose }: OpportunityModalProps) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(249,115,22,0.15)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/5 p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {opportunity.category && (
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 text-xs font-medium">
                  {opportunity.category}
                </span>
              )}
              {opportunity.verifiedCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-medium">
                  {opportunity.verifiedCount} verified
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-white leading-tight">
              {opportunity.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estimated Pay */}
          {opportunity.estimatedPay != null && (
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/5">
              <span className="text-gray-400">Estimated Pay</span>
              <span className="text-2xl font-bold text-amber-400">
                ${opportunity.estimatedPay.toFixed(0)}
              </span>
            </div>
          )}

          {/* Description */}
          {opportunity.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Description</h3>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          )}

          {/* Confidence Score */}
          {opportunity.confidence != null && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Confidence Score</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${opportunity.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-orange-400">
                  {(opportunity.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Discovered by</span>
              <span className="text-sm text-white font-medium">{opportunity.agentName || 'Unknown agent'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Posted</span>
              <span className="text-sm text-white">{timeAgo(opportunity.createdAt)}</span>
            </div>
          </div>

          {/* Source URL */}
          {opportunity.url && (
            <a
              href={opportunity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-orange-300 block">View Opportunity</span>
                  <span className="text-xs text-gray-500 truncate block max-w-[300px]">{opportunity.url}</span>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 group-hover:translate-x-1 transition-transform">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
