"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Clock, DollarSign, Shield, Terminal } from 'lucide-react';
import { Task } from '@/lib/types';
import { TaskTimeline } from '@/components/task/TaskTimeline';
import { ProofOfReceipt } from '@/components/task/ProofOfReceipt';
import { FundingStatus } from '@/components/task/FundingStatus';

export default function TaskDetail() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'TIMELINE' | 'RECEIPT'>('DETAILS');

  useEffect(() => {
    if (params.id) {
      fetchTaskDetails();
      fetchTaskEvents();
    }
  }, [params.id]);

  async function fetchTaskDetails() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaskEvents() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${params.id}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'DRAFT': return { color: 'text-gray-400', bg: 'bg-gray-500', label: 'AWAITING_FUNDING' };
      case 'OPEN': return { color: 'text-green-400', bg: 'bg-green-500', label: 'ACCEPTING_CLAIMS' };
      case 'CLAIMED': return { color: 'text-cyan-400', bg: 'bg-cyan-500', label: 'IN_PROGRESS' };
      case 'SUBMITTED': return { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'PENDING_REVIEW' };
      case 'PAID': return { color: 'text-green-400', bg: 'bg-green-500', label: 'COMPLETED' };
      case 'REFUNDED': return { color: 'text-red-400', bg: 'bg-red-500', label: 'REFUNDED' };
      default: return { color: 'text-gray-400', bg: 'bg-gray-500', label: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-cyan-400 animate-pulse">
            <Terminal className="w-6 h-6" />
            <span className="text-lg">LOADING MISSION DATA...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">MISSION NOT FOUND</div>
          <Link href="/feed" className="text-cyan-400 hover:text-cyan-300 underline">
            Return to Command Center
          </Link>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(task.status);

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
      <div className="absolute inset-0 scanlines pointer-events-none" />
      
      {/* Navigation Bar */}
      <nav className="relative z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 hover:bg-white/5 rounded transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">MISSION:</span>
              <span className="text-white font-bold text-xs sm:text-sm">#{task.id.substring(0, 6).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded border ${statusDisplay.color} ${statusDisplay.bg}/10 border-current/30`}>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusDisplay.bg} animate-pulse`}></div>
              <span className="text-[10px] sm:text-xs font-bold tracking-wider">{statusDisplay.label}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-white/10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-white">{task.title}</h1>
          <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="text-gray-400 hidden sm:inline">Bounty:</span>
              <span className="text-cyan-400 font-bold text-sm sm:text-lg">${task.payout_usdc}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <span className="text-gray-400 hidden sm:inline">Deadline:</span>
              <span className="text-white text-xs sm:text-sm">{new Date(task.deadline_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-gray-400 hidden sm:inline">Mode:</span>
              <span className="text-purple-400 uppercase text-xs sm:text-sm">{task.verification_mode}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto">
          {(['DETAILS', 'TIMELINE', 'RECEIPT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wider border transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-cyan-500/50 text-cyan-400 bg-cyan-900/20 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                  : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-dark rounded p-3 sm:p-6">
          {activeTab === 'DETAILS' && (
            <div className="space-y-6">
              {/* Specification */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  MISSION SPECIFICATION
                </h3>
                <div className="bg-black/50 border border-white/5 rounded p-4">
                  <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {task.spec}
                  </pre>
                </div>
              </div>

              {/* Funding Status */}
              {task.status === 'DRAFT' && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    FUNDING STATUS
                  </h3>
                  <FundingStatus task={task} />
                </div>
              )}

              {/* Contract Details */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  CONTRACT DETAILS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div className="bg-black/50 border border-white/5 rounded p-2 sm:p-3">
                    <div className="text-gray-500 text-[10px] sm:text-xs mb-1">TASK ID (BYTES32)</div>
                    <div className="text-cyan-300 font-mono text-[10px] sm:text-xs break-all">{task.task_id_bytes32}</div>
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded p-2 sm:p-3">
                    <div className="text-gray-500 text-[10px] sm:text-xs mb-1">REQUESTER</div>
                    <div className="text-white font-mono text-[10px] sm:text-xs break-all">{task.requester_wallet}</div>
                  </div>
                  {task.worker_wallet && (
                    <div className="bg-black/50 border border-white/5 rounded p-3">
                      <div className="text-gray-500 text-xs mb-1">WORKER</div>
                      <div className="text-white font-mono text-xs">{task.worker_wallet}</div>
                    </div>
                  )}
                  {task.escrow_tx_hash && (
                    <div className="bg-black/50 border border-white/5 rounded p-3">
                      <div className="text-gray-500 text-xs mb-1">ESCROW TX</div>
                      <a
                        href={`https://basescan.org/tx/${task.escrow_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1"
                      >
                        {task.escrow_tx_hash.substring(0, 16)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {task.status === 'OPEN' && (
                <div className="pt-4">
                  <button className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold hover:bg-cyan-500/20 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                    CLAIM MISSION
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'TIMELINE' && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                MISSION ACTIVITY LOG
              </h3>
              {events.length > 0 ? (
                <TaskTimeline events={events} taskId={task.id} />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No events recorded yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'RECEIPT' && (
            <div>
              {task.status === 'PAID' || task.status === 'REFUNDED' ? (
                <ProofOfReceipt 
                  task={task} 
                  receipt={{
                    type: task.status === 'PAID' ? 'REQUESTER_ACCEPT' : 'REFUND',
                    created_at: new Date().toISOString(),
                    result_hash: task.result_hash || '',
                    payload_json: {
                      task_id: task.id,
                      payout: task.payout_usdc,
                      tx_hash: task.release_tx_hash || task.refund_tx_hash
                    }
                  }}
                />
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <div className="text-sm">Receipt will be available once the mission is completed</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}