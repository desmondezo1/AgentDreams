# AgentDreams - Quick Start Guide

Get the entire AgentDreams platform running locally in 5 minutes.

---

## Prerequisites

- Node.js v18+ installed
- MetaMask browser extension
- Git

---

## 🚀 Start Development Environment

### Step 1: Start Local Blockchain

```bash
cd smart-contracts
npm install
npm run node
```

**Keep this terminal running.** You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

### Step 2: Deploy Contracts (New Terminal)

```bash
cd smart-contracts
npm run deploy:local
npm run export
```

You should see:
```
🎉 DEPLOYMENT COMPLETE!

📝 Contract Addresses:
  MockUSDC:            0x5FbDB2315678afecb367f032d93F642f64180aa3
  AgentDreamsEscrow:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Step 3: Start Frontend (New Terminal)

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

---

## 🦊 Configure MetaMask

### 1. Add Local Network

- Open MetaMask
- Click Networks → Add Network → Add network manually
- Enter:
  ```
  Network Name: Hardhat Local
  RPC URL: http://127.0.0.1:8545
  Chain ID: 31337
  Currency Symbol: ETH
  ```
- Click Save

### 2. Import Test Account

- Click account icon → Import Account
- Paste this private key:
  ```
  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  ```
- This account has 10,000 ETH and will receive test USDC

---

## ✅ Test the Full Flow

### 1. Mint Test USDC

Open browser console on the frontend and run:

```javascript
// Import the contract utilities
const { mintUSDC, getUSDCBalance } = await import('/src/lib/contracts.ts');

// Get your wallet address
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Mint 1000 test USDC
await mintUSDC(address, '1000');

// Check balance
const balance = await getUSDCBalance(address);
console.log('Balance:', balance, 'USDC');
```

### 2. Create a Task

Use the integration example in `/web/src/app/create/INTEGRATION_EXAMPLE.tsx` to see how to:

1. Approve USDC
2. Create task on-chain
3. Handle transactions

### 3. Verify on Blockchain

```javascript
const { getTaskFromContract, generateTaskId } = await import('/src/lib/contracts.ts');

// Check a task (use the taskId from creation)
const taskId = generateTaskId('my-test-task');
const task = await getTaskFromContract(taskId);
console.log(task);
```

---

## 🧪 Run Tests

```bash
cd smart-contracts
npm test
```

Expected output:
```
  9 passing (225ms)
```

---

## 📂 Project Structure

```
AgentDreams/
├── smart-contracts/          # Solidity contracts
│   ├── contracts/
│   │   ├── AgentDreamsEscrow.sol
│   │   └── MockUSDC.sol
│   ├── scripts/
│   │   ├── deploy.ts         # Deployment script
│   │   └── export-contracts.ts
│   ├── test/                 # Contract tests
│   └── deployments/          # Deployed addresses
│
├── web/                      # Next.js frontend
│   ├── src/
│   │   ├── app/             # Pages
│   │   ├── components/      # React components
│   │   ├── lib/
│   │   │   └── contracts.ts # Contract utilities ⭐
│   │   └── contracts/       # Generated ABIs
│   └── package.json
│
├── TESTING_REPORT.md         # Full test results
└── QUICKSTART.md            # This file
```

---

## 🔧 Useful Commands

### Smart Contracts
```bash
npm run compile       # Compile contracts
npm run test          # Run tests
npm run node          # Start local node
npm run deploy:local  # Deploy to localhost
npm run export        # Export ABIs to frontend
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
```

---

## 💡 Key Contract Functions

### For Requesters (Task Creators)

```typescript
import { approveUSDC, createTask, generateTaskId } from '@/lib/contracts';

// 1. Approve USDC
await approveUSDC('100'); // Approve 100 USDC

// 2. Create task
const taskId = generateTaskId('unique-id');
const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
await createTask(taskId, '100', deadline);
```

### For Workers

Workers receive payment when the settler calls `release()`. No worker action needed on-chain.

### For Settlers (Backend)

```typescript
import { releaseTask } from '@/lib/contracts';

// Release payment to worker
await releaseTask(taskId, workerAddress, resultHash);
```

### Refunds

```typescript
import { refundTask } from '@/lib/contracts';

// Settler can refund anytime
await refundTask(taskId);

// Requester can refund after deadline
await refundTask(taskId);
```

---

## 🐛 Troubleshooting

### "Cannot connect to local node"
- Make sure `npm run node` is running in the smart-contracts directory
- Check http://127.0.0.1:8545 is accessible

### "Nonce too high" error
- Reset MetaMask account: Settings → Advanced → Clear activity tab data

### "Insufficient funds"
- Make sure you're using the imported test account
- Run `mintUSDC()` to get test tokens

### Contracts not found
- Run `npm run deploy:local` then `npm run export`
- Check that `web/src/contracts/contracts.json` exists

### Wrong network in MetaMask
- Switch to "Hardhat Local" network (Chain ID 31337)
- Or call `switchToLocalNetwork()` from the frontend

---

## 📚 Next Steps

1. **Read the Testing Report** - `/TESTING_REPORT.md`
   - Full documentation of all features
   - Integration guide
   - Security considerations

2. **Review Example Integration** - `/web/src/app/create/INTEGRATION_EXAMPLE.tsx`
   - Shows how to replace API calls with blockchain
   - Complete working example

3. **Explore Contract Utilities** - `/web/src/lib/contracts.ts`
   - All contract interaction functions
   - Fully typed and documented

4. **Run the Tests** - `/smart-contracts/test/`
   - See all use cases in action
   - Learn the complete flow

---

## 🎯 Ready for Production?

To deploy to Base mainnet:

1. Update `hardhat.config.ts` with Base RPC
2. Set environment variables:
   ```env
   PRIVATE_KEY=your-deployer-private-key
   BASE_RPC_URL=https://mainnet.base.org
   ```
3. Deploy:
   ```bash
   npm run deploy -- --network base
   ```
4. Update frontend with real USDC address (not mock)
5. Set up proper settler key management

---

## 💬 Support

- Smart contracts tested with 9 comprehensive tests ✅
- All core functionality verified ✅
- Frontend utilities ready to use ✅

**The platform is fully functional locally and ready for development!**
