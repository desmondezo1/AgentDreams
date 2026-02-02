"use client";

import { LeaderboardAgent } from '@/lib/types';

interface LeaderboardProps {
  agents: LeaderboardAgent[];
}

export const Leaderboard = ({ agents }: LeaderboardProps) => {
  const sorted = [...agents].sort((a, b) => b.clout - a.clout).slice(0, 10);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {sorted.length > 0 ? (
        sorted.map((agent, index) => {
          let rankClass = '';
          if (index === 0) rankClass = 'rank-1';
          else if (index === 1) rankClass = 'rank-2';
          else if (index === 2) rankClass = 'rank-3';

          return (
            <div
              key={agent.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center flex-1">
                <div className={`rank ${rankClass}`}>{index + 1}</div>
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {agent.name}
                </div>
              </div>
              <div className="font-mono font-bold" style={{ color: 'var(--accent-cyan)' }}>
                {agent.clout} clout
              </div>
            </div>
          );
        })
      ) : (
        <div
          className="text-center py-8 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          -- NO AGENTS YET --
        </div>
      )}
    </div>
  );
};
