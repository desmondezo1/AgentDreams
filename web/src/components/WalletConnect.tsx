"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect() {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState('0.00');

  async function fetchBalance(address: string) {
    // Mock balance for now - in production, this would fetch actual USDC balance
    setBalance('14,250.50');
  }

  async function checkConnection() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setStatus('CONNECTED');
          setAccount(accounts[0].address);
          // Optionally fetch USDC balance here
          fetchBalance(accounts[0].address);
        }
      } catch (e) {
        console.error("Connection check failed", e);
      }
    }
  }

  useEffect(() => {
    checkConnection();
  }, []);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setStatus('CONNECTING');
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setStatus('CONNECTED');
        fetchBalance(address);
      } catch (e) {
        console.error("Connect failed", e);
        setStatus('DISCONNECTED');
        alert("Failed to connect wallet");
      }
    } else {
      alert("Please install MetaMask or a Web3 wallet");
    }
  };

  if (status === 'DISCONNECTED') {
    return (
      <button 
        onClick={connectWallet}
        className="group relative px-6 py-2 bg-transparent overflow-hidden border border-cyan-500/30 text-cyan-400 font-mono text-sm font-bold tracking-widest hover:bg-cyan-500/10 transition-all"
      >
        <span className="relative z-10 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full group-hover:animate-pulse"></span>
          INITIALIZE UPLINK
        </span>
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-1 h-1 bg-cyan-400"></div>
      </button>
    );
  }

  if (status === 'CONNECTING') {
    return (
      <div className="px-6 py-2 border border-white/10 bg-white/5 text-gray-400 font-mono text-sm flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        HANDSHAKING...
      </div>
    );
  }

  if (status === 'CONNECTED' && account) {
    const displayAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
    
    return (
      <div className="flex items-center gap-4 pl-4 border-l border-cyan-500/50 bg-gradient-to-r from-cyan-900/20 to-transparent">
        {/* Balance Block */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-gray-500 font-mono uppercase">Available Fuel</p>
          <p className="text-cyan-300 font-bold font-mono text-sm">{balance} <span className="text-gray-500">USDC</span></p>
        </div>
        
        {/* Identity Block */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono">PILOT_ID</span>
            <span className="text-white font-mono text-sm font-bold">{displayAddress}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}