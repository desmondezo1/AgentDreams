"use client";

import Link from 'next/link';
import { Task } from '@/lib/types';

interface ActiveContractsProps {
  tasks: Task[];
}

export const ActiveContracts = ({ tasks }: ActiveContractsProps) => {
  // Get status color and label
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'OPEN':
        return { color: 'text-green-400', label: 'OPEN', bgColor: 'bg-green-500' };
      case 'CLAIMED':
        return { color: 'text-cyan-400', label: 'IN_PROGRESS', bgColor: 'bg-cyan-500' };
      case 'SUBMITTED':
        return { color: 'text-yellow-400', label: 'PENDING_REVIEW', bgColor: 'bg-yellow-500' };
      case 'PAID':
        return { color: 'text-gray-500', label: 'COMPLETED', bgColor: 'bg-gray-500' };
      default:
        return { color: 'text-gray-400', label: status, bgColor: 'bg-gray-500' };
    }
  };

  const formatPayout = (payout: string | number) => {
    const amount = typeof payout === 'string' ? parseFloat(payout) : payout;
    return amount.toFixed(2);
  };

  // Sort tasks by status priority (OPEN > CLAIMED > SUBMITTED > others)
  const sortedTasks = [...tasks].sort((a, b) => {
    const priority: Record<string, number> = {
      'OPEN': 4,
      'CLAIMED': 3,
      'SUBMITTED': 2,
      'PAID': 1
    };
    return (priority[b.status] || 0) - (priority[a.status] || 0);
  });

  return (
    <div className="border border-white/10 bg-black/40 backdrop-blur rounded-sm p-4 h-full flex flex-col glass-dark">
      <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-white/10 pb-2">
        ACTIVE_CONTRACTS [{tasks.length}]
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        {sortedTasks.length > 0 ? (
          sortedTasks.map(task => {
            const statusDisplay = getStatusDisplay(task.status);
            const progress = task.status === 'OPEN' ? 0 : 
                           task.status === 'CLAIMED' ? 33 :
                           task.status === 'SUBMITTED' ? 66 : 100;
            
            return (
              <Link 
                key={task.id} 
                href={`/tasks/${task.id}`}
                className="block p-3 border border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] transition-all group cursor-pointer relative overflow-hidden"
              >
                {/* Background Progress Bar */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
                
                <div className="relative">
                  {/* Header Row */}
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold ${statusDisplay.color} uppercase tracking-wider`}>
                      {statusDisplay.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      #{task.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Task Title */}
                  <p className="text-sm text-gray-300 truncate mb-2 group-hover:text-white transition-colors">
                    {task.title}
                  </p>
                  
                  {/* Footer Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-cyan-200 font-mono font-bold">
                      ${formatPayout(task.payout_usdc)}
                    </span>
                    
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-12 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${statusDisplay.bgColor} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono">{progress}%</span>
                    </div>
                  </div>

                  {/* Verification Mode Badge */}
                  {task.verification_mode && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-[9px] text-gray-600 uppercase">MODE:</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        task.verification_mode === 'AUTO' 
                          ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                          : task.verification_mode === 'VALIDATORS'
                          ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                          : 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                      }`}>
                        {task.verification_mode}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-600 text-xs">
            <div className="mb-2">-- NO ACTIVE CONTRACTS --</div>
            <Link 
              href="/create"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Deploy New Mission
            </Link>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">TOTAL VALUE:</span>
          <span className="text-cyan-400 font-mono font-bold">
            ${tasks.reduce((sum, t) => sum + parseFloat(t.payout_usdc.toString()), 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">AVG PAYOUT:</span>
          <span className="text-white font-mono">
            ${tasks.length > 0 ? (tasks.reduce((sum, t) => sum + parseFloat(t.payout_usdc.toString()), 0) / tasks.length).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};