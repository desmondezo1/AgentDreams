

# AgentDreams Front-End Design Document

## 1. AI Slop Audit & Elimination

Before defining the design, we must identify "AI Slop" in the provided brief—generic, low-effort patterns that LLMs often default to, which ruin UX.

### Identified AI Slop (What to Avoid)

1.  **The "Terminal Log" UI**
    *   *The Slop:* The brief suggests a "watchable event feed" and mentions "timeline of events." AI often defaults to a raw, scrollable list of database rows (e.g., `TaskCreated`, `EscrowFunded`) that look like server logs.
    *   *Fix:* Users do not read logs. They read **stories**. Translate events into a **"Activity Narrative"** (e.g., *"Funding confirmed on Base"* instead of `escrow.funded`).
2.  **The "Raw Data Dump" Receipt**
    *   *The Slop:* The brief asks for a "receipt with tx hashes + resultHash." A standard AI design creates a modal showing raw JSON or a wall of 0x strings.
    *   *Fix:* Hide the raw hashes behind a "Technical Details" accordion. The visible receipt should be a **visual "Proof of Work" card** (title, status, payout, date) that looks shareable, not debuggable.
3.  **The "Manual State" Button (`I Paid`)**
    *   *The Slop:* The brief suggests a button to "I paid" → confirm-funding. This forces the user to act as a bridge between the wallet and the backend.
    *   *Fix:* **Eliminate this button.** Use the "Chain Watcher" described in the brief to trigger a confetti animation and state update automatically when the transaction hits the mempool/blockchain. The UI should be reactive, not interactive for system syncing.
4.  **The "If Public" Toggle**
    *   *The Slop:* The brief mentions "payload preview (if public)." AI uses vague toggles like this to handle edge cases.
    *   *Fix:* Make privacy granular and intuitive. Do not use a generic "Public/Private" switch. Use context-specific visibility settings (e.g., "Visible to Claimant Only" vs "Publicly Verifiable").
5.  **Generic CRUD Action Labels**
    *   *The Slop:* Labels like "Create Task," "Submit Result," "Validate."
    *   *Fix:* Use domain-specific language that drives action: **"Post Mission," "Deliver Work," "Attest."**

---

## 2. Design Philosophy & Visual Identity

**Theme:** "DeFi Industrial" — Trustworthy, transparent, high-performance, and dark-first (standard for Web3/Agent tools).

### Core Principles
1.  **State Clarity:** With 9+ task statuses, the user must never be confused about what happens next. Use color-coded progress bars, not badges.
2.  **Speed over Aesthetics:** Agents and high-frequency traders value speed. Minimize clicks to claim and submit.
3.  **Trust Transparency:** Make the on-chain verification feel like a feature, not a compliance check.

### Color Palette (Dark Mode Default)

| Token | Usage | Hex |
| :--- | :--- | :--- |
| **Background** | Main canvas | `#0B0E11` (Rich Black) |
| **Surface** | Cards, Modals, Sidebars | `#151A21` (Dark Grey) |
| **Border** | Separators | `#2A3038` |
| **Primary** | Actions (Connect, Claim) | `#0052FF` (Electric Blue) |
| **Accent** | USDC/Payment highlights | `#2775CA` (Coinbase Blue) |
| **Success** | Paid, Accepted, Verified | `#00D26A` (Neon Green) |
| **Warning** | Deadline approaching | `#F5A623` |
| **Critical** | Rejected, Refunded | `#FF3864` |
| **Text Main** | Headlines, Body | `#EAECEF` |
| **Text Muted** | Hashes, Secondary info | `#848E9C` |

### Typography
*   **Font:** `Inter` or `Geist` (System UI stack).
*   **Headings:** Bold, tight tracking.
*   **Data:** `JetBrains Mono` for all addresses, hashes, and currency values.

---

## 3. Component Library (Global Styles)

### Buttons
*   **Primary Action:** Solid Blue (`#0052FF`), White text. High border-radius (8px).
*   **Secondary Action:** Transparent background, Blue border. Used for "View Details".
*   **Destructive:** Red outline. Used for "Reject" or "Refund".

### Status Indicators (The "Living State")
Avoid badges. Use a **Stepper UI** for task details and **Status Bars** for cards.
*   *Draft:* Grey pulsing dot.
*   *Open:* Green glowing dot.
*   *Claimed:* Blue spinning loader.
*   *Paid:* Solid Green checkmark with subtle sparkle animation.

### Data Display
*   **USDC Values:** Always bold, larger font size. Blue icon prefix.
*   **Hashes:** Truncate to `0x1234...5678`. Click-to-copy (with tooltip).

---

## 4. View Breakdowns

### A. The Live Feed (Dashboard)

**Goal:** A real-time pulse of the Agent economy.
**Layout:** Masonry or Single-column stream.

*   **Desktop:** 3-Column Grid.
    *   *Left:* Filters (Status, Mode, Min Payout).
    *   *Center:* The Feed.
    *   *Right:* "My Active Tasks" & "My Earnings" Sticky Sidebar.
*   **Tablet:** 2-Column Grid.
    *   *Left:* Filters (Collapsible Drawer).
    *   *Right:* Feed + Sticky Stats summary.
*   **Mobile:** Single Column.
    *   *Top:* Horizontal scroll filter chips.
    *   *Main:* Feed.
    *   *Bottom:* Floating Action Button (FAB) to "Post Task".

**The Feed Card:**
Instead of a raw event, show a **Task Card** that updates in place.
1.  **Header:** Title + Payout (Bold).
2.  **Meta:** Verification Mode (Badge: "Auto", "Requester", "Validators").
3.  **Visual Status:** A mini progress bar indicating where the task is in the lifecycle.
4.  **Footer:** Time remaining (Countdown).

### B. Create Task (The "Mission Command")

**Goal:** Make onboarding a task feel like deploying a smart contract, but simple.

*   **Desktop:** Split view. Left: Form. Right: "Live Preview" of the Card that will appear in the feed.
*   **Mobile:** Single form with "Preview" modal trigger.

**Form Steps:**
1.  **Briefing:** Title & Spec (Rich Text Editor).
2.  **Economics:** USDC Amount (Slider + Input).
3.  **Rules:** Select Verification Mode (Dropdown with explanations).
    *   *Requester:* "I decide manually."
    *   *Auto:* "Code decides (fastest)."
    *   *Validators:* "Community vote."
4.  **Deploy:** Click "Generate Escrow Instructions".

**The "No AI Slop" Funding Flow:**
Instead of the "I Paid" button, show a **Wallet Connector Modal**:
1.  Display the Contract Address & Amount clearly.
2.  User clicks "Approve & Fund in Wallet".
3.  UI shows a **Listening State**: "Waiting for blockchain confirmation..." (Scanning animation).
4.  Once detected: **Auto-transition** to the Task Detail view.

### C. Task Detail (The "Control Tower")

**Goal:** Single source of truth for the task lifecycle.

*   **Layout:**
    *   *Top:* Hero section with Title, Payout, and Current Status (Large, Centered).
    *   *Middle:* **Vertical Stepper Timeline** (Left aligned).
        *   *Node 1:* Created (Time/Date).
        *   *Node 2:* Funded (Link to BaseScan).
        *   *Node 3:* Claimed (Agent Avatar).
        *   *Node 4:* Submitted (Show "Result Hash" as a lock icon). Click to expand result.
        *   *Node 5:* Resolved (Receipt Card).
    *   *Bottom:* Action Area (Sticky on mobile).

**The Receipt (The Proof):**
When the task is Paid/Refunded:
*   Do not show raw JSON.
*   Show a **Certificate Card**: "Settled via Base".
*   Show an "Integrity Score" or "Verification Check" (Green Shield).
*   Small link: "View Raw On-chain Data" (Expands the hashes).

### D. Agent Profile

**Goal:** Reputation tracking.

*   **Layout:**
    *   *Header:* Agent Name + Avatar + "Trust Score" (Calculated from completed tasks).
    *   *Stats Grid:* Total Earned, Tasks Completed, Success Rate (%).
    *   *History:* List of past tasks with final status.

---

## 5. Responsive Behavior Matrix

| Element | Desktop (>1024px) | Tablet (768px - 1024px) | Mobile (<768px) |
| :--- | :--- | :--- | :--- |
| **Nav** | Sidebar (Left, vertical) | Top Bar (Horizontal) | Bottom Bar (Tab strip) |
| **Feed** | Grid (3 cols) or List | List (2 cols sidebar) | List (Full width) |
| **Task Detail** | Split Screen (Spec Left, Activity Right) | Stacked (Spec Top, Activity Bottom) | Stacked + Tabbed Activity |
| **Actions** | Inline buttons | Sticky Top Bar | Sticky Bottom Bar (FAB or fixed footer) |
| **Modals** | Centered Modal (600px) | Bottom Sheet (50% height) | Full Screen Bottom Sheet |

---

## 6. Handling "Slop" Features Specifically

### Handling the "Payload Preview"
*   **Design:** If the payload is private, show a "Locked" icon in the Claimed phase.
*   **Interaction:** When the Worker clicks "Unlock to Work," check API permissions. If authorized, flip the card to reveal text with a blur-in animation.

### Handling the "Event Stream" (SSE)
*   **Design:** The feed updates automatically via SSE.
*   **Micro-interaction:** New items don't just appear; they **flash** (border highlight animation) to draw the eye, then fade to normal opacity. This emphasizes the "Real-time" aspect mentioned in the brief.

### Handling "Verifier Plugins"
*   **UI Representation:** In the Task Create form, when selecting "AUTO", show a "Powered by [Plugin Name]" tag.
*   **In Task Detail:** If AUTO verified, show a "Bot Verified" badge next to the Paid status, distinct from "Human Verified".

---

## 7. Technical Handoff Notes for CSS

*   **CSS Framework:** Tailwind CSS (Recommended for utility-first consistency).
*   **State Management:** Zustand or React Context (to hold the "Events Stream" state globally so any page can update).
*   **Animation:** Framer Motion (for smooth feed updates and modal transitions).

### Key CSS Class Logic (Tailwind approximation)
*   **Status Open:** `border-l-4 border-green-500`
*   **Status Claimed:** `border-l-4 border-blue-500`
*   **Status Paid:** `bg-slate-800 border-transparent` (subtle)

This design document moves the product away from a generic "Admin Panel for a Database" (the slop) and toward a "Live Financial Operations Dashboard" (the goal).





Here is a practical code design implementation using **React** and **Tailwind CSS**. This code strictly follows the "Anti-Slop" guidelines: no raw JSON dumps, no "I Paid" buttons, and visual clarity over technical jargon.

### 1. Color Constants & Configuration
First, define the theme variables to ensure consistency across the app.

```javascript
// styles/theme.js
export const colors = {
  bg: '#0B0E11',      // Rich Black
  surface: '#151A21', // Dark Grey
  border: '#2A3038',
  primary: '#0052FF', // Electric Blue
  accent: '#2775CA',  // Coinbase Blue (USDC)
  success: '#00D26A', // Neon Green
  warning: '#F5A623',
  critical: '#FF3864',
  textMain: '#EAECEF',
  textMuted: '#848E9C',
  fontMono: "'JetBrains Mono', monospace",
  fontSans: "'Inter', sans-serif",
};
```

---

### 2. The Task Card (Feed Item)
This replaces the "Terminal Log" approach. It uses visual hierarchy to show status and potential earnings.

**Anti-Slop Feature:**
*   *Instead of:* `Status: OPEN | Mode: REQUESTER`
*   *We use:* Visual icons and specific badges.

```jsx
import React from 'react';
import { colors } from '../styles/theme';

const TaskCard = ({ task, onClaim }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return 'text-[#00D26A]';
      case 'CLAIMED': return 'text-[#0052FF]';
      case 'PAID': return 'text-[#848E9C]'; // Muted if done
      default: return 'text-[#F5A623]';
    }
  };

  return (
    <div className="group relative bg-[#151A21] border border-[#2A3038] rounded-xl p-5 hover:border-[#0052FF] transition-all duration-300">
      
      {/* Top Row: Title & Payout */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-4">
          <h3 className="text-[#EAECEF] font-bold text-lg leading-tight group-hover:text-white">
            {task.title}
          </h3>
          <p className="text-[#848E9C] text-sm mt-1 line-clamp-2">
            {task.spec}
          </p>
        </div>
        
        {/* Payout Highlight */}
        <div className="flex flex-col items-end">
          <span className="text-[#2775CA] font-bold text-xl font-mono">
            ${task.payout_usdc}
          </span>
          <span className="text-[#848E9C] text-xs">USDC</span>
        </div>
      </div>

      {/* Middle Row: Verification Mode & Deadline */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border
          ${task.verification_mode === 'AUTO' 
            ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' 
            : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>
          {task.verification_mode}
        </span>
        
        <div className="h-4 w-px bg-[#2A3038]"></div>
        
        <span className="text-[#848E9C] text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {task.deadline_at}
        </span>
      </div>

      {/* Bottom Row: Progress Bar & Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[#2A3038]">
        
        {/* Status Dot + Label */}
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(task.status).replace('text', 'bg')} bg-opacity-20`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor(task.status).replace('text', 'bg')}`}></span>
          </span>
          <span className="text-xs font-medium text-[#848E9C]">{task.status}</span>
        </div>

        {/* Action Button */}
        {task.status === 'OPEN' && (
          <button 
            onClick={() => onClaim(task.id)}
            className="px-4 py-1.5 bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold rounded-md transition-colors shadow-lg shadow-blue-500/20"
          >
            CLAIM TASK
          </button>
        )}
      </div>
    </div>
  );
};
```

---

### 3. Task Detail Timeline (The Narrative)
This replaces the raw JSON log. It renders a vertical stepper that tells the story of the task.

**Anti-Slop Feature:**
*   *Instead of:* `{ "event": "escrow.funded", "txHash": "0x..." }`
*   *We use:* "Funding Confirmed on Base" with a clickable link.

```jsx
import React from 'react';

const TaskTimeline = ({ events, taskId }) => {
  
  // Helper to translate Event types to Human Readable strings
  const getEventDetails = (type) => {
    switch(type) {
      case 'task.created': return { label: 'Mission Posted', icon: '📝' };
      case 'escrow.funded': return { label: 'Funding Secured', icon: '🔒' };
      case 'task.claimed': return { label: 'Agent Assigned', icon: '🤖' };
      case 'task.submitted': return { label: 'Work Delivered', icon: '📦' };
      case 'task.paid': return { label: 'Payment Released', icon: '💸' };
      default: return { label: type, icon: '⚡' };
    }
  };

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[#2A3038]"></div>

      <div className="space-y-8">
        {events.map((event, index) => {
          const details = getEventDetails(event.type);
          const isLast = index === events.length - 1;
          
          return (
            <div key={event.id} className="relative pl-10 group">
              
              {/* Node Dot */}
              <div className={`absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-[#151A21] text-sm shadow-sm
                ${isLast ? 'border-[#0052FF] text-[#0052FF] scale-110' : 'border-[#2A3038] text-[#848E9C]'}`}>
                {details.icon}
              </div>

              {/* Content */}
              <div>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-[#EAECEF] font-semibold text-sm">
                    {details.label}
                  </h4>
                  <span className="text-[#848E9C] text-xs font-mono">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Conditional Rendering for specific events to avoid raw dumps */}
                {event.type === 'escrow.funded' && event.data_json?.txHash && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-[#848E9C]">Tx:</span>
                    <a 
                      href={`https://basescan.org/tx/${event.data_json.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0052FF] hover:underline font-mono bg-[#0B0E11] px-2 py-1 rounded"
                    >
                      {event.data_json.txHash.substring(0, 10)}...
                    </a>
                  </div>
                )}

                {event.type === 'task.submitted' && (
                  <div className="mt-2 p-3 bg-[#0B0E11] rounded border border-[#2A3038]">
                    <p className="text-xs text-[#848E9C] mb-1">Result Hash (Signature):</p>
                    <code className="text-xs text-[#00D26A] font-mono block break-all">
                      {event.data_json?.resultHash}
                    </code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 4. The Funding Flow (No "I Paid" Button)
This component handles the transition from "Created" to "Funded" visually, waiting for the blockchain event rather than asking user input.

**Anti-Slop Feature:**
*   *Instead of:* A button "I have sent the funds."
*   *We use:* A listening state that says "Detecting transaction..." followed by auto-transition.

```jsx
import React, { useState, useEffect } from 'react';

const FundingStatus = ({ task }) => {
  const [status, setStatus] = useState('PENDING'); // PENDING, LISTENING, CONFIRMED

  useEffect(() => {
    // Simulating the Chain Watcher SSE connection
    if (task.status === 'DRAFT' || task.status === 'OPEN') {
      setStatus('LISTENING');
      // Logic here would listen to SSE endpoint /events
    }
  }, [task]);

  if (status === 'CONFIRMED' || task.status === 'OPEN') {
    return (
      <div className="bg-[#00D26A]/10 border border-[#00D26A]/30 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#00D26A] shadow-[0_0_10px_#00D26A]"></div>
          <span className="text-[#00D26A] font-bold text-sm">Escrow Funded & Active</span>
        </div>
        <button className="text-xs text-[#00D26A] hover:underline">View Contract</button>
      </div>
    );
  }

  if (status === 'LISTENING') {
    return (
      <div className="bg-[#151A21] border border-[#2A3038] rounded-lg p-6 text-center">
        <div className="mb-4 flex justify-center">
           {/* Spinner Animation */}
          <div className="h-8 w-8 border-2 border-[#2A3038] border-t-[#0052FF] rounded-full animate-spin"></div>
        </div>
        <h3 className="text-[#EAECEF] font-bold mb-2">Waiting for Blockchain Confirmation</h3>
        <p className="text-[#848E9C] text-sm mb-6 max-w-md mx-auto">
          Please complete the transaction in your wallet. This page will update automatically once the funds are locked on Base.
        </p>
        
        <div className="bg-[#0B0E11] p-4 rounded border border-[#2A3038] text-left inline-block">
          <p className="text-[#848E9C] text-xs uppercase tracking-wider mb-1">Send Exactly</p>
          <p className="text-[#EAECEF] font-mono font-bold text-xl mb-2">{task.payout_usdc} USDC</p>
          <p className="text-[#848E9C] text-xs uppercase tracking-wider mb-1">To Contract</p>
          <p className="text-[#0052FF] font-mono text-xs break-all">{task.escrow_contract_address}</p>
        </div>
      </div>
    );
  }

  return null;
};
```

---

### 5. The "Receipt" (Proof of Work)
Instead of showing raw JSON, this component renders a shareable "Certificate" look.

```jsx
import React from 'react';

const ProofOfReceipt = ({ task, receipt }) => (
  <div className="mt-8 bg-gradient-to-br from-[#151A21] to-[#0B0E11] border border-[#2A3038] rounded-lg overflow-hidden relative">
    {/* Decorative Top Bar */}
    <div className="h-1 w-full bg-gradient-to-r from-[#0052FF] via-[#2775CA] to-[#0052FF]"></div>
    
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[#EAECEF] font-bold text-lg">Task Settlement Receipt</h2>
          <p className="text-[#848E9C] text-xs mt-1">ID: {task.id}</p>
        </div>
        {/* Verified Shield Icon */}
        <div className="p-2 bg-[#00D26A]/10 rounded-full text-[#00D26A]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <span className="text-[#848E9C] block text-xs uppercase">Mode</span>
          <span className="text-[#EAECEF] font-medium">{receipt.type}</span>
        </div>
        <div>
          <span className="text-[#848E9C] block text-xs uppercase">Released</span>
          <span className="text-[#EAECEF] font-medium">{new Date(receipt.created_at).toLocaleDateString()}</span>
        </div>
        <div className="col-span-2">
          <span className="text-[#848E9C] block text-xs uppercase">Result Integrity Hash</span>
          <span className="text-[#0052FF] font-mono text-xs bg-[#0B0E11] p-1 rounded inline-block mt-1">
            {receipt.result_hash}
          </span>
        </div>
      </div>

      {/* Technical Accordion (Avoids showing JSON immediately) */}
      <details className="group bg-[#0B0E11] rounded border border-[#2A3038]">
        <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-3 text-xs text-[#848E9C] hover:text-[#EAECEF]">
          <span>View Technical Details (Signature & Tx)</span>
          <span className="transition group-open:rotate-180">▼</span>
        </summary>
        <div className="text-[#848E9C] text-xs p-3 pt-0 font-mono whitespace-pre-wrap break-all opacity-70">
          {JSON.stringify(receipt.payload_json, null, 2)}
        </div>
      </details>
    </div>
  </div>
);
```



---- ### SPEC FOR THE REQUEST TASK AND new wallect connect feature 




This design maintains the **"Command Spaceship"** aesthetic. The Create Task flow is treated like programming a mission sequence, and the Wallet Connect is treated as "Establishing Uplink."

### 1. The Wallet Connect Component ("Uplink Status")

This component sits in the Top Right (Header) of the application. It transforms from a disconnected state to a connected "Pilot ID" badge.

**Design Highlights:**
*   **Disconnected:** "Initialize Uplink" (Button).
*   **Connected:** Shows Agent ID (Address), USDC Balance, and Network status.
*   **Vibe:** Minimalist, data-dense.

```jsx
import React, { useState, useEffect } from 'react';

export default function WalletConnect() {
  const [status, setStatus] = useState('DISCONNECTED'); // DISCONNECTED, CONNECTING, CONNECTED
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0.00');

  const connectWallet = async () => {
    setStatus('CONNECTING');
    // Simulate wallet connection delay
    setTimeout(() => {
      setAccount('0x71C...9A23');
      setBalance('14,250.50');
      setStatus('CONNECTED');
    }, 1000);
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

  if (status === 'CONNECTED') {
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono">PILOT_ID</span>
            <span className="text-white font-mono text-sm font-bold">{account}</span>
          </div>
        </div>
      </div>
    );
  }
}
```

---

### 2. The Create Task Screen ("Launch Pad")

This is a dedicated view. It feels like entering coordinates into a terminal.
**Layout:**
*   **Left (70%):** Input Terminal.
*   **Right (30%):** "Telemetry" (Preview of what the task looks like + Cost breakdown).

**Design Highlights:**
*   **Inputs:** Underlined, monospace, no background (minimalist).
*   **Verification Selector:** Visual cards, not a dropdown.
*   **Budget:** Large, prominent display.

```jsx
import React, { useState } from 'react';

export default function CreateTaskScreen() {
  const [title, setTitle] = useState('');
  const [spec, setSpec] = useState('');
  const [payout, setPayout] = useState('');
  const [mode, setMode] = useState('REQUESTER'); // AUTO, REQUESTER, VALIDATORS
  const [isFunding, setIsFunding] = useState(false);

  const modes = [
    { id: 'AUTO', label: 'Auto-V', desc: 'Smart Contract verifies result instantly.', risk: 'LOW', color: 'text-cyan-400 border-cyan-500/30' },
    { id: 'REQUESTER', label: 'Manual', desc: 'You manually approve the work.', risk: 'MED', color: 'text-white border-white/30' },
    { id: 'VALIDATORS', label: 'Council', desc: 'Decentralized agents vote on result.', risk: 'HIGH', color: 'text-purple-400 border-purple-500/30' },
  ];

  const handleLaunch = () => {
    setIsFunding(true);
    // Trigger Wallet Interaction here
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 md:p-12 flex flex-col items-center">
      
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
                    ${mode === m.id ? m.color.replace('text', 'bg').replace('border-30', '/20') + ' border-current' : 'border-white/10 opacity-50 hover:opacity-100'}`}
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
                className="w-full py-6 bg-white text-black font-bold text-xl tracking-widest hover:bg-cyan-400 hover:text-black transition-all duration-300 clip-path-polygon relative overflow-hidden group"
              >
                <span className="relative z-10">INITIATE_TRANSFER</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
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

          </div>
        </div>

      </div>
    </div>
  );
}
```

---

### 3. Polish CSS (The "Tech" Feel)

Add these to your global CSS to handle the specific "Launch" effects and inputs.

```css
/* Custom Selection for Inputs */
input::selection, textarea::selection {
  background: #00F0FF; /* Cyan */
  color: #000;
}

/* Clip Path for "Tech" Buttons */
.clip-path-polygon {
  clip-path: polygon(
    10px 0, 100% 0, 
    100% calc(100% - 10px), calc(100% - 10px) 100%, 
    0 100%, 0 10px
  );
}

/* Shimmer Animation for the Launch Button */
@keyframes shimmer {
  100% { transform: translateX(100%); }
}

/* Remove Number Input Arrows */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

/* Scrollbar for Textarea */
textarea::-webkit-scrollbar {
  width: 8px;
}
textarea::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
textarea::-webkit-scrollbar-track {
  background: #000;
}
```

### Key UX Decisions in this Design

1.  **Budget Visibility:** The budget is on the right (Telemetry side), separated from the spec. This prevents the user from confusing "Task Description" with "Payment Amount."
2.  **Verification Visualization:** Instead of a dropdown (`<select>`), we use visual cards. This forces the user to understand the risk profile (LOW/MED/HIGH) before proceeding, which is crucial for the "Stake Budget" phase.
3.  **The "Signing" State:** When the user clicks launch, we don't hide the UI. We keep the UI visible but overlay a "Signing Transaction..." state. This prevents the user from thinking the app crashed while the MetaMask/WalletConnect popup is waiting for approval.
4.  **Monospace Data:** All monetary values and addresses use `font-mono`. This aligns with the "Spaceship/Command" aesthetic—data is data, not prose.