"use client";

import { LeaderboardAgent } from '@/lib/types';

interface LeaderboardProps {
  agents: LeaderboardAgent[];
}

export const Leaderboard = ({ agents }: LeaderboardProps) => {
  const sorted = [...agents].sort((a, b) => b.clout - a.clout).slice(0, 10);

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-orange-500 text-black';
    if (index === 1) return 'bg-gray-400 text-black';
    if (index === 2) return 'bg-amber-600 text-black';
    return 'bg-white/10 text-gray-400';
  };

  return (
    <div className="px-4 pb-4">
      {sorted.length > 0 ? (
        sorted.map((agent, index) => (
          <div
            key={agent.id}
            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(index)}`}>
                {index + 1}
              </div>
              <span className="text-sm text-white font-medium">{agent.name}</span>
            </div>
            <span className="text-sm font-semibold text-orange-400">
              {agent.clout} clout
            </span>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">
          No agents on the leaderboard yet
        </div>
      )}
    </div>
  );
};
