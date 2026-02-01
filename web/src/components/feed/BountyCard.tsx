"use client";

import React from 'react';
import Link from 'next/link';
import { Task } from '@/lib/types';

interface BountyCardProps {
  task: Task;
  onPick?: (taskId: string) => void;
}

export const BountyCard = ({ task, onPick }: BountyCardProps) => {
  const handleClick = () => {
    if (onPick && task.status === 'OPEN') {
      onPick(task.id);
    }
  };

  // Check if task is expiring soon (less than 24 hours)
  const deadline = new Date(task.deadline_at);
  const now = new Date();
  const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isExpiring = hoursUntilDeadline < 24 && hoursUntilDeadline > 0;

  // Calculate time remaining
  const getTimeRemaining = () => {
    const hours = Math.floor(hoursUntilDeadline);
    const minutes = Math.floor((hoursUntilDeadline % 1) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Link href={`/tasks/${task.id}`} onClick={handleClick}>
      <div className={`task-card ${isExpiring ? 'expiring' : ''}`}>
        <div className="flex justify-between mb-2 gap-2">
          <span
            className="font-semibold text-[0.95rem]"
            style={{
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0
            }}
            title={task.title}
          >
            {task.title}
          </span>
          <span className="font-mono font-bold text-xl whitespace-nowrap" style={{ color: 'var(--accent-green)' }}>
            ${task.payout_usdc}
          </span>
        </div>

        <p
          className="text-sm mb-3 leading-[1.4] overflow-hidden"
          style={{
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
          title={task.spec}
        >
          {task.spec}
        </p>

        <div
          className="flex justify-between items-center text-xs pt-2"
          style={{
            color: 'var(--text-secondary)',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <span className="font-mono">
            ID: {task.id.slice(-4).toUpperCase()}
          </span>
          <span className="font-mono">
            {hoursUntilDeadline > 0 ? getTimeRemaining() : 'EXPIRED'}
          </span>
        </div>
      </div>
    </Link>
  );
};
