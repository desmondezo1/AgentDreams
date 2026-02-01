"use client";

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  task_id?: string;
  actor_agent_id?: string;
  data_json: any;
  created_at: string;
}

interface TaskTimelineProps {
  events: TimelineEvent[];
  taskId: string;
}

export const TaskTimeline = ({ events, taskId }: TaskTimelineProps) => {
  
  // Helper to translate Event types to Human Readable strings
  const getEventDetails = (type: string) => {
    switch(type) {
      case 'task.created': 
        return { label: 'MISSION_INITIALIZED', icon: '⚡', color: 'text-purple-400' };
      case 'escrow.funded': 
        return { label: 'FUNDING_SECURED', icon: '🔒', color: 'text-green-400' };
      case 'task.claimed': 
        return { label: 'AGENT_ASSIGNED', icon: '🤖', color: 'text-cyan-400' };
      case 'task.submitted': 
        return { label: 'WORK_DELIVERED', icon: '📦', color: 'text-yellow-400' };
      case 'task.accepted':
        return { label: 'RESULT_VERIFIED', icon: '✓', color: 'text-green-400' };
      case 'task.paid': 
        return { label: 'PAYMENT_RELEASED', icon: '💸', color: 'text-green-400' };
      case 'task.rejected':
        return { label: 'RESULT_REJECTED', icon: '✗', color: 'text-red-400' };
      case 'task.refunded':
        return { label: 'FUNDS_REFUNDED', icon: '↩', color: 'text-orange-400' };
      default: 
        return { label: type.replace('.', '_').toUpperCase(), icon: '•', color: 'text-gray-400' };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-3 top-2 bottom-2 w-[1px] bg-gradient-to-b from-cyan-500/20 via-cyan-500/10 to-transparent"></div>

      <div className="space-y-6">
        {events.map((event, index) => {
          const details = getEventDetails(event.type);
          const isLast = index === events.length - 1;
          const timestamp = formatTime(event.created_at);
          
          return (
            <div key={event.id} className="relative pl-10 group animate-slide-up">
              
              {/* Node Dot with Glow */}
              <div className={`absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-black text-sm shadow-sm transition-all
                ${isLast 
                  ? `border-cyan-500 ${details.color} scale-110 shadow-[0_0_20px_rgba(0,240,255,0.5)]` 
                  : `border-white/20 text-gray-500 group-hover:border-white/40`}`}>
                {details.icon}
              </div>

              {/* Content */}
              <div className="glass bg-black/50 rounded p-4 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className={`font-mono text-xs font-bold tracking-wider ${details.color}`}>
                      {details.label}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-600 font-mono">
                        {timestamp.date}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {timestamp.time}
                      </span>
                    </div>
                  </div>
                  {event.actor_agent_id && (
                    <span className="text-[10px] text-gray-600 font-mono">
                      AGENT: {event.actor_agent_id.substring(0, 8)}
                    </span>
                  )}
                </div>

                {/* Event-specific content */}
                {event.type === 'escrow.funded' && event.data_json?.tx_hash && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase">TX:</span>
                      <a 
                        href={`https://basescan.org/tx/${event.data_json.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                      >
                        {event.data_json.tx_hash.substring(0, 16)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {event.type === 'task.submitted' && event.data_json?.submission_hash && (
                  <div className="mt-3 p-2 bg-black/50 rounded border border-white/5">
                    <p className="text-[10px] text-gray-500 mb-1 uppercase">Result Hash:</p>
                    <code className="text-[11px] text-green-400 font-mono block break-all">
                      {event.data_json.submission_hash}
                    </code>
                  </div>
                )}

                {event.type === 'task.paid' && event.data_json?.payout && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Amount:</span>
                    <span className="text-sm text-cyan-400 font-bold font-mono">
                      ${event.data_json.payout} USDC
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};