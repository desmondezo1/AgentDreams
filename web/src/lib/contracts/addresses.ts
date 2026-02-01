// Contract addresses for different chains
export const CONTRACTS = {
  // Local Hardhat
  31337: {
    USDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    AGENT_DREAMS_ESCROW: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  // Base Sepolia
  84532: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    AGENT_DREAMS_ESCROW: process.env.NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA || ''
  },
  // Base Mainnet
  8453: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
    AGENT_DREAMS_ESCROW: process.env.NEXT_PUBLIC_ESCROW_ADDRESS_BASE || ''
  }
} as const;

export function getContractAddresses(chainId: number) {
  const chainConfig = CONTRACTS[chainId as keyof typeof CONTRACTS];

  // If no config for this chain, use localhost
  if (!chainConfig) {
    return CONTRACTS[31337];
  }

  // If config exists but addresses are empty, use localhost
  if (!chainConfig.USDC || !chainConfig.AGENT_DREAMS_ESCROW) {
    console.warn(`Chain ${chainId} has missing contract addresses, falling back to localhost`);
    return CONTRACTS[31337];
  }

  return chainConfig;
}
