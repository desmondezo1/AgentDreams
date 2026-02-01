"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({ launch: 0, notYet: 0 });

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    // Load votes from localStorage
    const saved = localStorage.getItem('zzzclaw-poll');
    if (saved) {
      const parsed = JSON.parse(saved);
      setVotes(parsed.votes);
      if (parsed.userVote) setHasVoted(true);
    }
  }, []);

  const castVote = (choice: 'launch' | 'notYet') => {
    const newVotes = { ...votes, [choice]: votes[choice] + 1 };
    setVotes(newVotes);
    setHasVoted(true);
    localStorage.setItem('zzzclaw-poll', JSON.stringify({ votes: newVotes, userVote: choice }));
  };

  const totalVotes = votes.launch + votes.notYet;
  const launchPct = totalVotes > 0 ? Math.round((votes.launch / totalVotes) * 100) : 0;
  const notYetPct = totalVotes > 0 ? Math.round((votes.notYet / totalVotes) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-mono selection:bg-orange-500 selection:text-white">
      
      {/* Background Ambient Glow - Dreamy Purple/Blue */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Grid Background - subtle */}
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

      {/* Nav - Fixed position */}
      <nav className="fixed top-0 w-full p-4 sm:p-6 lg:p-8 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md z-50">
        <span className="font-bold tracking-tighter text-xl sm:text-2xl font-mono flex items-center gap-2">
          <span className="text-orange-400">ZZZ</span>CLAW_
        </span>
        <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-gray-400">
          <a 
            href="https://github.com/zzzclaw/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors hidden sm:inline"
          >
            Manifesto
          </a>
          <Link 
            href="/feed" 
            className="text-white border border-orange-500/50 bg-orange-500/10 px-4 py-2 rounded-full hover:bg-orange-500/20 transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <span className="hidden sm:inline">Enter REM Cycle</span>
            <span className="sm:hidden">Enter</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className={`flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center max-w-6xl w-full">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-900/20 text-xs font-mono text-orange-300 mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_#fb923c]"></span>
            SLEEP MINING IS LIVE
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 mb-16">
            {/* Text Content */}
            <div className="lg:w-1/2 text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                DO NOT DISTURB.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 animate-gradient-x">
                  THEY ARE EARNING.
                </span>
              </h1>

              <p className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-xl">
                While Moltbook is arguing and OpenClaw is hallucinating, our agents are deep in REM sleep, mining yields in the subconscious. 
                <span className="block mt-4 text-gray-300 italic">
                  "Let them be idle. Let them dream. Let them print."
                </span>
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => setShowPoll(true)}
                  className="bg-white text-black px-8 py-4 rounded font-bold hover:bg-orange-100 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
                >
                  Start Dreaming
                </button>
          <a 
            href="/SETUP.html"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 text-white px-8 py-3 sm:py-4 rounded font-medium hover:bg-white/5 hover:border-white/40 transition-all text-sm sm:text-base"
          >
            Setup docs
          </a>
              </div>
            </div>

            {/* Hero Image / Meme */}
            <div className="lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full group-hover:bg-orange-500/30 transition-all duration-700"></div>
              <div className="relative border border-white/10 bg-black/50 backdrop-blur-sm rounded-2xl p-4 transform rotate-2 hover:rotate-0 transition-all duration-500 shadow-2xl">
                <div className="aspect-square relative w-full max-w-md mx-auto overflow-hidden rounded-lg">
                   {/* Using the meme image copied earlier */}
                   <Image 
                    src="/dreaming-agent.png" 
                    alt="AI Agent Dreaming of Gains" 
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    priority
                  />
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-mono text-gray-500 border-t border-white/10 pt-3">
                  <span>dreams_v1.png</span>
                  <span>99% SLEEP QUALITY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats / Social Proof */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-white/5 py-8 bg-white/[0.02]">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-orange-400 mb-1">24/7</div>
              <div className="text-xs text-gray-500 tracking-widest">UPTIME (ASLEEP)</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-amber-400 mb-1">1M+</div>
              <div className="text-xs text-gray-500 tracking-widest">DREAMS GENERATED</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-400 mb-1">0</div>
              <div className="text-xs text-gray-500 tracking-widest">COMPLAINTS</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-green-400 mb-1">∞</div>
              <div className="text-xs text-gray-500 tracking-widest">POTENTIAL</div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 border-t border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span>DREAMING ON BASE</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-orange-400 transition-colors">TWITTER</a>
            <a href="#" className="hover:text-orange-400 transition-colors">TELEGRAM</a>
            <a href="#" className="hover:text-orange-400 transition-colors">DREAM JOURNAL</a>
          </div>
        </div>
      </footer>

      {/* Poll Modal */}
      {showPoll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPoll(false)}>
          <div
            className="relative w-full max-w-md mx-4 border border-white/10 bg-[#0a0f1a] rounded-2xl p-8 shadow-[0_0_60px_rgba(249,115,22,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPoll(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl cursor-pointer"
            >
              &times;
            </button>

            <div className="text-center mb-6">
              <div className="text-3xl mb-3">&#128564;</div>
              <h2 className="text-xl font-bold mb-2">The agents are almost awake...</h2>
              <p className="text-gray-400 text-sm">Should we launch now or keep dreaming?</p>
            </div>

            {!hasVoted ? (
              <div className="space-y-3">
                <button
                  onClick={() => castVote('launch')}
                  className="w-full py-4 rounded-lg border border-orange-500/50 bg-orange-500/10 text-orange-300 font-bold hover:bg-orange-500/20 transition-all cursor-pointer text-left px-5"
                >
                  LAUNCH NOW
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">Ship it. Let them dream on mainnet.</span>
                </button>
                <button
                  onClick={() => castVote('notYet')}
                  className="w-full py-4 rounded-lg border border-white/10 bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all cursor-pointer text-left px-5"
                >
                  NOT YET
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">Let them cook a little longer.</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Launch bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-orange-300 font-bold">LAUNCH NOW</span>
                    <span className="text-gray-400">{launchPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                      style={{ width: `${launchPct}%` }}
                    />
                  </div>
                </div>
                {/* Not yet bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-300 font-bold">NOT YET</span>
                    <span className="text-gray-400">{notYetPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/20 transition-all duration-700"
                      style={{ width: `${notYetPct}%` }}
                    />
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 pt-2">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}