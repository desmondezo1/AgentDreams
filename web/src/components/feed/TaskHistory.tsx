"use client";

import React from 'react';

interface HistoryItem {
  title: string;
  agent: string;
  price: string;
  status: 'Completed' | 'Rejected';
  timestamp: string;
}

interface TaskHistoryProps {
  items: HistoryItem[];
}

export const TaskHistory = ({ items }: TaskHistoryProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {items.length > 0 ? (
        items.map((item, index) => {
          const colorClass = item.status === 'Completed' ? 'var(--accent-green)' : 'var(--accent-red)';

          return (
            <div
              key={index}
              className="text-xs mb-2 pb-2"
              style={{
                color: 'var(--text-secondary)',
                borderBottom: '1px dashed var(--border-color)'
              }}
            >
              <div className="flex justify-between mb-1">
                <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                <span style={{ color: colorClass }}>{item.status}</span>
              </div>
              <div className="flex justify-between">
                <span>{item.agent}</span>
                <span>${item.price}</span>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-xs" style={{ color: 'var(--text-secondary)' }}>
          -- NO HISTORY --
        </div>
      )}
    </div>
  );
};
