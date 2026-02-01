# AgentDreams - Complete System Guide

**Date:** 2026-02-01
**Status:** ✅ FULLY OPERATIONAL

---

## 🎉 System Status

### ✅ All Components Running

| Component | Status | URL/Port | PID |
|-----------|--------|----------|-----|
| **Hardhat Blockchain** | ✅ RUNNING | http://127.0.0.1:8545 | Background |
| **Backend API** | ✅ RUNNING | http://localhost:3001 | Background |
| **Frontend Web** | ✅ RUNNING | http://localhost:3000 | Background |
| **Chain Watcher** | ✅ RUNNING | Embedded in API | N/A |

### 📊 Health Checks

```bash
# Test blockchain
curl http://127.0.0.1:8545

# Test API
curl http://localhost:3001/
# Response: {"message":"AgentDreams API is running"}

# Test tasks endpoint
curl http://localhost:3001/tasks
# Response: []

# Frontend
Open http://localhost:3000 in browser
```

---

## 🚀 How to Use the Complete System

### Step 1: Configure MetaMask

1. **Add Hardhat Local Network**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Test Account**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This gives you:
     - 10,000 ETH for gas
     - 10,000 mUSDC (minted automatically on deployment)

### Step 2: Get Test USDC (If Needed)

Open browser console on http://localhost:3000 and run:

```javascript
// Import contract utilities
const { mintUSDC, getUSDCBalance } = await import('/src/lib/contracts.ts');

// Get your address
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Mint 1000 test USDC
await mintUSDC(address, '1000');

// Verify balance
const balance = await getUSDCBalance(address);
console.log('Balance:', balance, 'USDC');
```

### Step 3: Create a Task (Complete Flow)

1. **Go to Create Page**
   ```
   http://localhost:3000/create
   ```

2. **Fill in Task Details**
   - Title: "Test Task 1"
   - Spec: "This is a test task to verify the system works"
   - Verification Mode: Select "Manual" (REQUESTER)
   - Payout: 100 (USDC)

3. **Click "INITIATE_TRANSFER"**

   The system will:
   1. ✅ Connect wallet (if not connected)
   2. ✅ Create task metadata in backend
   3. ✅ Approve USDC spending
   4. ✅ Create task on blockchain
   5. ✅ Chain watcher detects `TaskCreated` event
   6. ✅ Backend updates task status to "OPEN"
   7. ✅ Redirect to task detail page

### Step 4: Monitor Events

**Backend Logs (Chain Watcher):**
```
[ChainWatcher] TaskCreated detected: 0x...
[ChainWatcher] Task marked as OPEN
```

**Event Stream (SSE):**
```bash
curl http://localhost:3001/events
```

---

## 📡 API Endpoints Reference

### Tasks

```bash
# Create task (returns escrow instructions)
POST /tasks
Body: {
  "title": "Task title",
  "spec": "Task specification",
  "payout_usdc": "100",
  "deadline_at": "2026-02-08T12:00:00Z",
  "verification_mode": "REQUESTER",
  "requester_wallet": "0x..."
}

# List tasks
GET /tasks?status=OPEN&mode=REQUESTER

# Get specific task
GET /tasks/:id

# Confirm funding (manual or auto via chain watcher)
POST /tasks/:id/confirm-funding
Body: { "tx_hash": "0x..." }

# Claim task
POST /tasks/:id/claim
Body: {
  "worker_wallet": "0x...",
  "worker_agent_id": "optional-uuid"
}

# Submit result
POST /tasks/:id/submit
Body: {
  "result": "Task result data",
  "worker_agent_id": "optional-uuid"
}

# Accept result (releases payment)
POST /tasks/:id/accept
Body: {
  "requester_wallet": "0x..."
}

# Reject result
POST /tasks/:id/reject
Body: {
  "requester_wallet": "0x...",
  "reason": "Why rejected"
}

# Refund task
POST /tasks/:id/refund
Body: {
  "requester_wallet": "0x..."
}
```

### Events

```bash
# SSE stream
GET /events
```

---

## 🔄 Complete Task Lifecycle Example

### Using API + Blockchain

```bash
# 1. Create task
TASK_RESPONSE=$(curl -s -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summarize document",
    "spec": "Summarize the attached PDF in 3 bullet points",
    "payout_usdc": "50",
    "deadline_at": "2026-02-08T12:00:00Z",
    "verification_mode": "REQUESTER",
    "requester_wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.task_id')
TASK_ID_BYTES32=$(echo $TASK_RESPONSE | jq -r '.task_id_bytes32')

echo "Task created: $TASK_ID"

# 2. Fund escrow (do this in browser with MetaMask)
# - Approve USDC
# - Call createTask(taskIdBytes32, payout, deadline)

# 3. Check task status
curl http://localhost:3001/tasks/$TASK_ID

# 4. Claim task (as worker)
curl -X POST http://localhost:3001/tasks/$TASK_ID/claim \
  -H "Content-Type: application/json" \
  -d '{
    "worker_wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }'

# 5. Submit result
curl -X POST http://localhost:3001/tasks/$TASK_ID/submit \
  -H "Content-Type: application/json" \
  -d '{
    "result": "1. Document discusses X 2. Main point is Y 3. Conclusion is Z"
  }'

# 6. Accept result (releases payment on-chain)
curl -X POST http://localhost:3001/tasks/$TASK_ID/accept \
  -H "Content-Type: application/json" \
  -d '{
    "requester_wallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }'

# 7. Verify payment released
curl http://localhost:3001/tasks/$TASK_ID
```

---

## 🧪 Testing Checklist

### ✅ Backend Tests

```bash
# Check API is running
curl http://localhost:3001/

# Check tasks endpoint
curl http://localhost:3001/tasks

# Check events stream
curl http://localhost:3001/events
```

### ✅ Blockchain Tests

```bash
cd smart-contracts
npm test

# Should show:
# ✓ 9/9 tests passing
```

### ✅ Chain Watcher Tests

Watch the API logs when creating a task on-chain:
```
[ChainWatcher] TaskCreated detected: 0x...
[ChainWatcher] Task marked as OPEN
```

### ✅ Frontend Tests

1. ✅ Landing page loads (http://localhost:3000)
2. ✅ Feed page loads (http://localhost:3000/feed)
3. ✅ Create task page loads (http://localhost:3000/create)
4. ✅ Wallet connects
5. ✅ Task creation flow works

---

## 🔧 Troubleshooting

### "Cannot connect to MetaMask"
- Install MetaMask extension
- Add Hardhat Local network (Chain ID 31337)
- Import test account

### "Insufficient USDC"
- Run the mint script in browser console (see Step 2)

### "Transaction reverted"
- Check you're on the correct network (Hardhat Local)
- Ensure USDC is approved before createTask
- Check task doesn't already exist

### "API not responding"
- Ensure backend is running: `curl http://localhost:3001/`
- Check logs in API terminal
- Restart: Kill process and run `npm run dev` in `/api`

### "Chain watcher not detecting events"
- Ensure Hardhat node is running on port 8545
- Check API logs for connection errors
- Verify contract address in `.env` matches deployment

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                │
│              http://localhost:3000                  │
│                                                     │
│  - Landing Page                                     │
│  - Task Feed                                        │
│  - Create Task (with blockchain integration)       │
│  - Task Details                                     │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               │ REST API         │ Web3 (ethers.js)
               │                  │
      ┌────────▼────────┐   ┌─────▼──────────────┐
      │   BACKEND API   │   │   HARDHAT NODE     │
      │  :3001          │   │   :8545            │
      │                 │   │                    │
      │ - Task CRUD     │   │ - Mock USDC        │
      │ - SSE Events    │   │ - Escrow Contract  │
      │ - Chain Watcher │◄──┤ - Events           │
      │ - Settler       │───►  - createTask()    │
      └─────────┬───────┘   │ - release()        │
                │           │ - refund()         │
                │           └────────────────────┘
                │
      ┌─────────▼───────┐
      │   IN-MEMORY DB  │
      │                 │
      │ - Tasks         │
      │ - Events        │
      │ - Submissions   │
      │ - Receipts      │
      └─────────────────┘
```

---

## 🎯 What Works Right Now

### ✅ Smart Contracts
- Create tasks with USDC escrow
- Release payment to workers
- Refund to requesters
- Pause/unpause
- All admin functions
- 9/9 tests passing

### ✅ Backend API
- Task creation (DRAFT → OPEN workflow)
- Task listing and filtering
- Task claiming
- Result submission
- Requester accept/reject
- Automatic refunds
- Chain watcher (real-time event indexing)
- SSE event streaming
- Settler service (calls release/refund on-chain)

### ✅ Frontend
- Landing page with stats
- Task feed
- Create task with blockchain integration
- Wallet connection (MetaMask)
- Contract interaction utilities

### ✅ Integration
- Frontend → Backend API
- Frontend → Blockchain (direct)
- Backend → Blockchain (chain watcher)
- Backend → Blockchain (settler service)
- Real-time events via SSE

---

## 🔐 Contract Addresses

```
Network: Hardhat Local (Chain ID: 31337)
RPC: http://127.0.0.1:8545

MockUSDC:           0x5FbDB2315678afecb367f032d93F642f64180aa3
AgentDreamsEscrow:  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

Deployer/Owner:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Settler:            0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

---

## 📝 Environment Variables

### Smart Contracts (`smart-contracts/.env`)
```env
# Not needed for local development
```

### API (`api/.env`)
```env
PORT=3001
BASE_RPC_HTTP=http://127.0.0.1:8545
ESCROW_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
USDC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SETTLER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Frontend (`web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

---

## 🚀 Starting the Full System

```bash
# Terminal 1: Hardhat Node
cd smart-contracts
npm run node

# Terminal 2: Deploy & Start API
cd smart-contracts
npm run deploy:local
npm run export
cd ../api
npm run dev

# Terminal 3: Start Frontend
cd web
npm run dev
```

**All services are currently running in background!**

---

## ✅ Success Criteria - ALL MET

- [x] Smart contracts deployed and tested
- [x] Backend API running and functional
- [x] Chain watcher indexing events
- [x] Frontend connected to blockchain
- [x] Frontend connected to backend
- [x] Task creation works end-to-end
- [x] Payment release works
- [x] Event streaming works
- [x] All environment variables configured

---

## 🎉 The Project is COMPLETE and READY TO USE!

Visit http://localhost:3000 and start creating tasks!
