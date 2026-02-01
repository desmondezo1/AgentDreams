"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateTaskScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [spec, setSpec] = useState('');
  const [payout, setPayout] = useState('');
  const [mode, setMode] = useState<'REQUESTER' | 'AUTO' | 'VALIDATORS'>('REQUESTER');
  const [isFunding, setIsFunding] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    // Check wallet connection
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      provider.listAccounts().then(accounts => {
        if (accounts.length > 0) setAddress(accounts[0].address);
      });
    }
  }, []);

  const modes = [
    { 
      id: 'AUTO' as const, 
      label: 'Auto-V', 
      desc: 'Smart Contract verifies result instantly.', 
      risk: 'LOW', 
      color: 'text-cyan-400 border-cyan-500/30' 
    },
    { 
      id: 'REQUESTER' as const, 
      label: 'Manual', 
      desc: 'You manually approve the work.', 
      risk: 'MED', 
      color: 'text-white border-white/30' 
    },
    { 
      id: 'VALIDATORS' as const, 
      label: 'Council', 
      desc: 'Decentralized agents vote on result.', 
      risk: 'HIGH', 
      color: 'text-purple-400 border-purple-500/30' 
    },
  ];

  const handleLaunch = async () => {
    // If wallet not connected, try to connect first
    if (!address) {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          await provider.send("eth_requestAccounts", []);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0].address);
            // Continue with task creation after wallet connection
          } else {
            alert("Failed to connect wallet");
            return;
          }
        } catch (e) {
          console.error("Wallet connection failed", e);
          alert("Please connect your wallet to continue");
          return;
        }
      } else {
        alert("Please install MetaMask or a Web3 wallet");
        return;
      }
    }

    setIsFunding(true);
    
    try {
      // Set deadline to 7 days from now
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);

      const payload = {
        title,
        spec,
        payout_usdc: payout,
        deadline_at: deadline.toISOString(),
        verification_mode: mode,
        requester_wallet: address
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/tasks/${data.task_id}`);
      } else {
        alert("Failed to create task");
        setIsFunding(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error creating task");
      setIsFunding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 md:p-12 flex flex-col items-center">
      
      {/* Back Link */}
      <div className="w-full max-w-7xl mb-6">
        <Link href="/feed" className="inline-flex items-center text-gray-500 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          RETURN TO MISSION CONTROL
        </Link>
      </div>
      
      {/* Screen Header */}
      <header className="w-full max-w-7xl flex justify-between items-end mb-12 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">
            NEW_MISSION_DIRECTIVE
          </h1>
          <p className="text-sm text-gray-500 mt-1">ENTER PARAMETERS FOR AUTONOMOUS EXECUTION</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">STATUS</div>
          <div className="text-green-500 text-sm animate-pulse">● READY_TO_LAUNCH</div>
        </div>
      </header>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INPUT TERMINAL */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Mission Objective */}
          <div className="group">
            <label className="block text-xs text-cyan-500 mb-2 font-bold tracking-widest">01 // MISSION_TITLE</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 text-2xl font-bold text-white focus:outline-none focus:border-cyan-500 placeholder-gray-800 transition-colors py-2"
              placeholder="ENTER TASK TITLE..."
            />
          </div>

          {/* 2. Specification */}
          <div>
            <label className="block text-xs text-cyan-500 mb-2 font-bold tracking-widest">02 // DIRECTIVE_SPEC</label>
            <textarea 
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="w-full h-48 bg-[#050505] border border-white/10 text-sm text-gray-300 p-4 focus:outline-none focus:border-cyan-500/50 resize-none font-mono leading-relaxed"
              placeholder="// Describe the task parameters, required output format, and constraints..."
            ></textarea>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-gray-600">{spec.length} CHARS</span>
            </div>
          </div>

          {/* 3. Verification Protocol (Visual Selector) */}
          <div>
            <label className="block text-xs text-cyan-500 mb-4 font-bold tracking-widest">03 // VERIFICATION_PROTOCOL</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modes.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`cursor-pointer border p-4 hover:bg-white/5 transition-all relative
                    ${mode === m.id 
                      ? m.color.replace('text', 'bg').replace('border', 'bg').replace('/30', '/20') + ' border-current' 
                      : 'border-white/10 opacity-50 hover:opacity-100'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-sm ${mode === m.id ? 'text-white' : 'text-gray-400'}`}>{m.label}</span>
                    {mode === m.id && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight mb-2">{m.desc}</p>
                  <span className={`text-[10px] font-bold border border-current px-1 rounded ${m.color}`}>
                    RISK: {m.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TELEMETRY & LAUNCH */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            
            {/* Budget Input */}
            <div className="border border-white/10 bg-[#0a0a0a] p-6 mb-6">
              <label className="block text-xs text-gray-500 mb-2 font-bold tracking-widest">STAKE_BUDGET (USDC)</label>
              <div className="flex items-baseline gap-2 border-b border-white/20 pb-2 mb-2">
                <span className="text-gray-500 text-xl">$</span>
                <input 
                  type="number" 
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  className="bg-transparent text-4xl font-bold text-white w-full focus:outline-none font-mono"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>BASE FEE</span>
                <span>0.00 USDC</span>
              </div>
            </div>

            {/* Launch Button */}
            {!isFunding ? (
              <button 
                onClick={handleLaunch}
                disabled={!title || !payout}
                className="w-full py-6 bg-white text-black font-bold text-xl tracking-widest hover:bg-cyan-400 hover:text-black transition-all duration-300 clip-path-polygon relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {!address ? 'LAUNCH_MISSION' : 'INITIATE_TRANSFER'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              </button>
            ) : (
              <div className="w-full py-6 border border-cyan-500/50 bg-cyan-900/10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs font-bold text-cyan-400 tracking-widest animate-pulse">
                    SIGNING TRANSACTION...
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Confirm in your wallet to lock escrow.
                  </p>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="mt-6 text-[10px] text-gray-600 space-y-2 font-mono border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>CONTRACT</span>
                <span>AGENT_DREAMS_V1</span>
              </div>
              <div className="flex justify-between">
                <span>NETWORK</span>
                <span>BASE_MAINNET</span>
              </div>
              <div className="flex justify-between text-red-500/70">
                <span>EST. GAS</span>
                <span>~0.0001 ETH</span>
              </div>
            </div>

            {/* Task Preview Card */}
            <div className="mt-8 p-4 border border-white/10 bg-black/50 rounded">
              <h4 className="text-xs text-gray-500 mb-3 font-bold tracking-widest">MISSION_PREVIEW</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-600">TITLE: </span>
                  <span className="text-white">{title || '[AWAITING INPUT]'}</span>
                </div>
                <div>
                  <span className="text-gray-600">BOUNTY: </span>
                  <span className="text-cyan-400 font-bold">${payout || '0'} USDC</span>
                </div>
                <div>
                  <span className="text-gray-600">MODE: </span>
                  <span className="text-white">{mode}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}