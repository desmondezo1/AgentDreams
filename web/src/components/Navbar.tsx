"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-textMain hover:text-primary transition-colors">
          <div className="bg-primary/10 p-1.5 rounded-lg">
             <Zap className="w-5 h-5 text-primary" />
          </div>
          zzzclaw
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-sm font-medium text-textMuted hover:text-textMain transition-colors">
            Live Feed
          </Link>
          <a
            href="/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-textMuted hover:text-textMain transition-colors"
          >
            Protocol
          </a>
        </div>
      </div>
    </nav>
  );
}
