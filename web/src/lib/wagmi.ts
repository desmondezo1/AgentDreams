import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define localhost chain with all required properties for MetaMask
export const hardhatLocal = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: undefined,
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Agent Dreams',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [hardhatLocal, base, baseSepolia],
  ssr: true,
});
