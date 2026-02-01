"use client";

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { Shield, CheckCircle, ChevronDown, ChevronUp, ExternalLink, Copy } from 'lucide-react';

interface Receipt {
  type: string;
  created_at: string;
  result_hash: string;
  payload_json: any;
}

interface ProofOfReceiptProps {
  task: Task;
  receipt: Receipt;
}

export const ProofOfReceipt = ({ task, receipt }: ProofOfReceiptProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt.payload_json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReceiptType = (type: string) => {
    switch(type) {
      case 'AUTO_VERIFIED':
        return { label: 'AUTOMATED_VERIFICATION', color: 'text-purple-400', bg: 'bg-purple-500' };
      case 'REQUESTER_ACCEPT':
        return { label: 'REQUESTER_VERIFICATION', color: 'text-cyan-400', bg: 'bg-cyan-500' };
      case 'VALIDATOR_CONSENSUS':
        return { label: 'VALIDATOR_CONSENSUS', color: 'text-yellow-400', bg: 'bg-yellow-500' };
      case 'REFUND':
        return { label: 'FUNDS_REFUNDED', color: 'text-orange-400', bg: 'bg-orange-500' };
      default:
        return { label: type, color: 'text-gray-400', bg: 'bg-gray-500' };
    }
  };

  const receiptType = getReceiptType(receipt.type);

  return (
    <div className="mt-8 bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded overflow-hidden relative glass-dark animate-slide-up">
      {/* Decorative Top Bar with animated gradient */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-green-500 to-cyan-500 animate-pulse-glow"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-white font-bold text-lg uppercase tracking-wider mb-1">
              SETTLEMENT_CERTIFICATE
            </h2>
            <p className="text-gray-500 text-xs font-mono">
              MISSION_ID: #{task.id.substring(0, 12).toUpperCase()}
            </p>
          </div>
          
          {/* Verified Shield with Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            <div className="relative p-2 bg-green-500/10 rounded-full text-green-400 border border-green-500/30">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Receipt Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="bg-black/50 border border-white/5 rounded p-3">
            <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">
              Verification Mode
            </span>
            <span className={`font-medium ${receiptType.color} font-mono text-xs`}>
              {receiptType.label}
            </span>
          </div>
          
          <div className="bg-black/50 border border-white/5 rounded p-3">
            <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">
              Settlement Date
            </span>
            <span className="text-white font-mono text-xs">
              {new Date(receipt.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="col-span-2 bg-black/50 border border-white/5 rounded p-3">
            <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">
              Payout Amount
            </span>
            <span className="text-cyan-400 font-mono font-bold text-xl text-glow-cyan">
              ${task.payout_usdc} USDC
            </span>
          </div>
          
          {receipt.result_hash && (
            <div className="col-span-2 bg-black/50 border border-white/5 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">
                Result Integrity Hash
              </span>
              <span className="text-green-400 font-mono text-[11px] break-all">
                {receipt.result_hash}
              </span>
            </div>
          )}

          {receipt.payload_json?.tx_hash && (
            <div className="col-span-2 bg-black/50 border border-white/5 rounded p-3">
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">
                Settlement Transaction
              </span>
              <a
                href={`https://basescan.org/tx/${receipt.payload_json.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1"
              >
                {receipt.payload_json.tx_hash.substring(0, 20)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Technical Details Accordion */}
        <div className="bg-black/50 rounded border border-white/10 overflow-hidden">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex justify-between items-center font-medium p-3 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className="uppercase tracking-wider">TECHNICAL_DETAILS</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]">(SIGNATURE & DATA)</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          
          {expanded && (
            <div className="border-t border-white/10 p-3 relative">
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <pre className="text-gray-500 text-[10px] font-mono whitespace-pre-wrap break-all opacity-70 pr-8">
                {JSON.stringify(receipt.payload_json, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Verification Status Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-mono uppercase tracking-wider">
                CRYPTOGRAPHICALLY_VERIFIED
              </span>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              PROTOCOL: AGENTDREAMS_V1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};