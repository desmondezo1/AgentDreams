"use client";

import React from 'react';
import { Clock } from 'lucide-react';
import { Task } from '@/lib/types';
import Link from 'next/link';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'text-success bg-success';
      case 'CLAIMED': return 'text-primary bg-primary';
      case 'PAID': return 'text-textMuted bg-textMuted'; // Muted if done
      default: return 'text-warning bg-warning';
    }
  };

  const statusColorClass = getStatusColor(task.status);
  const textColorClass = statusColorClass.split(' ')[0];
  const bgColorClass = statusColorClass.split(' ')[1];

  return (
    <div className="group relative bg-surface border border-border rounded-xl p-5 hover:border-primary transition-all duration-300 flex flex-col h-full">
      
      {/* Top Row: Title & Payout */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-4">
          <Link href={`/tasks/${task.id}`} className="block">
            <h3 className="text-textMain font-bold text-lg leading-tight group-hover:text-white transition-colors">
              {task.title}
            </h3>
          </Link>
          <p className="text-textMuted text-sm mt-1 line-clamp-2">
            {task.spec}
          </p>
        </div>
        
        {/* Payout Highlight */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-accent font-bold text-xl font-mono">
            ${task.payout_usdc}
          </span>
          <span className="text-textMuted text-xs">USDC</span>
        </div>
      </div>

      {/* Middle Row: Verification Mode & Deadline */}
      <div className="flex items-center gap-3 mb-4 mt-auto pt-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border
          ${task.verification_mode === 'AUTO' 
            ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' 
            : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>
          {task.verification_mode}
        </span>
        
        <div className="h-4 w-px bg-border"></div>
        
        <span className="text-textMuted text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(task.deadline_at).toLocaleDateString()}
        </span>
      </div>

      {/* Bottom Row: Progress Bar & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        
        {/* Status Dot + Label */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bgColorClass} bg-opacity-20`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${bgColorClass}`}></span>
          </span>
          <span className="text-xs font-medium text-textMuted">{task.status}</span>
        </div>

        {/* Action Button */}
        {task.status === 'OPEN' && (
          <Link 
            href={`/tasks/${task.id}`}
            className="px-4 py-1.5 bg-primary hover:bg-blue-600 text-white text-xs font-bold rounded-md transition-colors shadow-lg shadow-blue-500/20"
          >
            CLAIM TASK
          </Link>
        )}
         {task.status === 'DRAFT' && (
          <Link 
            href={`/tasks/${task.id}`}
            className="px-4 py-1.5 bg-surface border border-border hover:border-textMuted text-textMuted text-xs font-bold rounded-md transition-colors"
          >
            FINALIZE
          </Link>
        )}
      </div>
    </div>
  );
};
