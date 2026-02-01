"use client";

import { useEffect, useState } from 'react';

interface SystemStatusProps {
  connected: boolean;
  tasksCount: number;
  volume24h: number;
  latency: number;
}

export const SystemStatus = ({ connected, tasksCount, volume24h, latency }: SystemStatusProps) => {
  const [walletAddress, setWalletAddress] = useState<string>('0x0000...0000');
  const [graphData, setGraphData] = useState<number[]>([]);

  useEffect(() => {
    // Generate random graph data for visual effect
    const data = Array.from({ length: 20 }, () => Math.random() * 100);
    setTimeout(() => setGraphData(data), 0);

    // Simulate wallet connection (in production, this would be actual wallet integration)
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet) {
      setTimeout(() => setWalletAddress(storedWallet), 0);
    }
  }, []);

  return (
    <div className="border border-white/10 bg-black/40 backdrop-blur p-4 h-full rounded-sm glass-dark flex flex-col">
      {/* Status Header */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_#00FF94]' : 'bg-red-500 shadow-[0_0_10px_#FF2A6D]'}`}></div>
        <span className="text-sm font-bold tracking-widest text-gray-300">
          SYSTEM: {connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
      
      {/* Stats Grid */}
      <div className="space-y-6 flex-1">
        <div>
          <h3 className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">OPERATOR</h3>
          <p className="text-sm text-cyan-300 font-mono">{walletAddress}</p>
        </div>
        
        <div>
          <h3 className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">NETWORK LATENCY</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-sm text-white font-mono">{latency}ms</p>
            <span className="text-[10px] text-gray-600">[BASE]</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">ACTIVE CONTRACTS</h3>
          <p className="text-2xl text-white font-bold font-mono">{tasksCount}</p>
        </div>
        
        <div>
          <h3 className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">TOTAL VOLUME (24H)</h3>
          <p className="text-lg text-cyan-400 font-bold font-mono text-glow-cyan">
            ${volume24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div>
          <h3 className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">GAS PRICE</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-sm text-white font-mono">2.1 gwei</p>
            <span className="text-[10px] text-green-400">▼ -12%</span>
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="mt-auto pt-6">
        <h3 className="text-[10px] uppercase text-gray-500 mb-2 tracking-wider">NETWORK ACTIVITY</h3>
        <div className="h-32 w-full border border-white/5 bg-white/[0.02] relative overflow-hidden rounded">
          <div className="absolute bottom-0 left-0 right-0 h-full flex items-end gap-[2px] p-1">
            {graphData.map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/20 hover:from-cyan-400 hover:to-cyan-300/30 transition-all duration-300" 
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full grid grid-rows-4 grid-cols-10">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/[0.02]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};