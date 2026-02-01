"use client";

import { useState } from 'react';

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
  const [expanded, setExpanded] = useState(false);
  
  // Determine accent color based on event type
  const getAccentClasses = (type: string) => {
    if (type.includes('paid') || type.includes('accepted')) 
      return 'border-green-500 text-green-400';
    if (type.includes('claim')) 
      return 'border-cyan-500 text-cyan-400';
    if (type.includes('reject') || type.includes('failed')) 
      return 'border-red-500 text-red-400';
    if (type.includes('submit')) 
      return 'border-yellow-500 text-yellow-400';
    if (type.includes('funded') || type.includes('created')) 
      return 'border-purple-500 text-purple-400';
    return 'border-gray-700 text-gray-300';
  };

  const accentClasses = getAccentClasses(event.type);
  const [borderClass, textClass] = accentClasses.split(' ');

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div 
      className={`flex gap-2 sm:gap-4 p-2 sm:p-3 border-l-2 ${borderClass} bg-white/[0.02] hover:bg-white/[0.05] transition-all group animate-slide-up cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      
      {/* Timestamp Column */}
      <div className="text-[9px] sm:text-[10px] text-gray-600 font-mono pt-0.5 sm:pt-1 min-w-[50px] sm:min-w-[60px]">
        {formatTime(event.timestamp)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${textClass}`}>
            [{event.type.replace('.', '_').toUpperCase()}]
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500 font-mono hidden sm:inline">
            AGENT: {event.agentId ? event.agentId.substring(0, 8) : 'SYSTEM'}
          </span>
          {event.taskId && (
            <span className="text-[10px] sm:text-xs text-gray-600 font-mono hidden md:inline">
              TASK: {event.taskId.substring(0, 8)}
            </span>
          )}
        </div>
        
        <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed truncate sm:whitespace-normal">
          <span className="opacity-50">{'>'}</span> {event.message}
        </p>
        
        {/* Expanded Details */}
        {expanded && (event.txHash || event.details) && (
          <div className="mt-2 animate-slide-up">
            <div className="text-[10px] text-gray-500 border border-white/5 p-2 bg-black/50 font-mono space-y-1">
              {event.txHash && (
                <div>
                  TX_HASH: <a 
                    href={`https://basescan.org/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.txHash.substring(0, 20)}...
                  </a>
                </div>
              )}
              {event.details && (
                <div>
                  DATA: <span className="text-gray-400">
                    {JSON.stringify(event.details).substring(0, 100)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-start pt-1">
        <div className={`w-2 h-2 rounded-full ${borderClass.replace('border-', 'bg-')} animate-pulse-glow shadow-[0_0_10px] ${borderClass.replace('border-', 'shadow-')}`}></div>
      </div>
    </div>
  );
};