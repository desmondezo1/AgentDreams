"use client";

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { CheckCircle, Loader2, Copy, ExternalLink } from 'lucide-react';

interface FundingStatusProps {
  task: Task;
}

export const FundingStatus = ({ task }: FundingStatusProps) => {
  const [copied, setCopied] = useState(false);
  
  const status = (task.status === 'OPEN' || task.status !== 'DRAFT') ? 'CONFIRMED' : 'LISTENING';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'CONFIRMED') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded p-4 flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_15px_#00FF94] animate-pulse"></div>
          <span className="text-green-400 font-bold text-sm uppercase tracking-wider">
            ESCROW_FUNDED_AND_ACTIVE
          </span>
        </div>
        {task.escrow_tx_hash && (
          <a
            href={`https://basescan.org/tx/${task.escrow_tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-400 hover:text-green-300 font-mono flex items-center gap-1"
          >
            View Contract
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  if (status === 'LISTENING') {
    return (
      <div className="glass-dark rounded p-6 text-center animate-slide-up">
        <div className="mb-4 flex justify-center">
          {/* Animated Scanner Effect */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border border-cyan-400/20 rounded-full animate-ping"></div>
            <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
          </div>
        </div>
        
        <h3 className="text-white font-bold mb-2 text-lg uppercase tracking-wider">
          AWAITING_BLOCKCHAIN_CONFIRMATION
        </h3>
        
        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto font-mono leading-relaxed">
          Complete the transaction in your wallet. This interface will update automatically once funds are locked on Base.
        </p>
        
        <div className="bg-black/50 p-4 rounded border border-white/10 text-left inline-block">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Send Exactly</p>
              <p className="text-cyan-400 font-mono font-bold text-xl text-glow-cyan">
                {task.payout_usdc} USDC
              </p>
            </div>
            
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">To Contract Address</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-xs break-all">
                  {process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x0000...0000'}
                </p>
                <button
                  onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Task ID (Bytes32)</p>
              <p className="text-gray-400 font-mono text-[10px] break-all">
                {task.task_id_bytes32}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="font-mono">MONITORING_NETWORK...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};