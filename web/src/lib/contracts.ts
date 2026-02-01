import { ethers } from 'ethers';
import contractsData from '../contracts/contracts.json';

// Contract addresses and ABIs
export const CONTRACTS = {
  USDC: {
    address: contractsData.contracts.MockUSDC.address as string,
    abi: contractsData.contracts.MockUSDC.abi,
  },
  Escrow: {
    address: contractsData.contracts.AgentDreamsEscrow.address as string,
    abi: contractsData.contracts.AgentDreamsEscrow.abi,
  },
};

export const NETWORK = {
  chainId: contractsData.chainId,
  rpcUrl: contractsData.rpcUrl,
  name: contractsData.network,
};

export const DEPLOYER_ADDRESS = contractsData.accounts.deployer;
export const SETTLER_ADDRESS = contractsData.accounts.settler;

/**
 * Get ethers provider from window.ethereum
 */
export function getProvider(): ethers.BrowserProvider | null {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return null;
}

/**
 * Get signer from provider
 */
export async function getSigner(): Promise<ethers.Signer | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    await provider.send("eth_requestAccounts", []);
    return await provider.getSigner();
  } catch (error) {
    console.error('Failed to get signer:', error);
    return null;
  }
}

/**
 * Get USDC contract instance
 */
export async function getUSDCContract(signer?: ethers.Signer) {
  const signerOrProvider = signer || await getSigner();
  if (!signerOrProvider) throw new Error('No signer available');

  return new ethers.Contract(
    CONTRACTS.USDC.address,
    CONTRACTS.USDC.abi,
    signerOrProvider
  );
}

/**
 * Get AgentDreamsEscrow contract instance
 */
export async function getEscrowContract(signer?: ethers.Signer) {
  const signerOrProvider = signer || await getSigner();
  if (!signerOrProvider) throw new Error('No signer available');

  return new ethers.Contract(
    CONTRACTS.Escrow.address,
    CONTRACTS.Escrow.abi,
    signerOrProvider
  );
}

/**
 * Approve USDC spending for escrow contract
 */
export async function approveUSDC(amount: string): Promise<ethers.ContractTransactionResponse> {
  const usdc = await getUSDCContract();
  const amountWei = ethers.parseUnits(amount, 18); // MockUSDC uses 18 decimals

  const tx = await usdc.approve(CONTRACTS.Escrow.address, amountWei);
  return tx;
}

/**
 * Check USDC allowance for escrow contract
 */
export async function checkUSDCAllowance(userAddress: string): Promise<string> {
  const usdc = await getUSDCContract();
  const allowance = await usdc.allowance(userAddress, CONTRACTS.Escrow.address);
  return ethers.formatUnits(allowance, 18);
}

/**
 * Get USDC balance
 */
export async function getUSDCBalance(address: string): Promise<string> {
  const usdc = await getUSDCContract();
  const balance = await usdc.balanceOf(address);
  return ethers.formatUnits(balance, 18);
}

/**
 * Mint USDC (only works with MockUSDC on local network)
 */
export async function mintUSDC(to: string, amount: string): Promise<ethers.ContractTransactionResponse> {
  const usdc = await getUSDCContract();
  const amountWei = ethers.parseUnits(amount, 18);

  const tx = await usdc.mint(to, amountWei);
  return tx;
}

/**
 * Create a new escrow task
 */
export async function createTask(
  taskId: string,
  payout: string,
  deadlineTimestamp: number
): Promise<ethers.ContractTransactionResponse> {
  const escrow = await getEscrowContract();

  // Convert taskId to bytes32 if it's not already
  const taskIdBytes32 = taskId.startsWith('0x')
    ? taskId
    : ethers.keccak256(ethers.toUtf8Bytes(taskId));

  const payoutWei = ethers.parseUnits(payout, 18);

  const tx = await escrow.createTask(taskIdBytes32, payoutWei, deadlineTimestamp);
  return tx;
}

/**
 * Release task payment to worker (settler only)
 */
export async function releaseTask(
  taskId: string,
  workerAddress: string,
  resultHash: string
): Promise<ethers.ContractTransactionResponse> {
  const escrow = await getEscrowContract();

  const taskIdBytes32 = taskId.startsWith('0x')
    ? taskId
    : ethers.keccak256(ethers.toUtf8Bytes(taskId));

  const resultHashBytes32 = resultHash.startsWith('0x')
    ? resultHash
    : ethers.keccak256(ethers.toUtf8Bytes(resultHash));

  const tx = await escrow.release(taskIdBytes32, workerAddress, resultHashBytes32);
  return tx;
}

/**
 * Refund task to requester
 */
export async function refundTask(taskId: string): Promise<ethers.ContractTransactionResponse> {
  const escrow = await getEscrowContract();

  const taskIdBytes32 = taskId.startsWith('0x')
    ? taskId
    : ethers.keccak256(ethers.toUtf8Bytes(taskId));

  const tx = await escrow.refund(taskIdBytes32);
  return tx;
}

/**
 * Get task details from contract
 */
export async function getTaskFromContract(taskId: string) {
  const escrow = await getEscrowContract();

  const taskIdBytes32 = taskId.startsWith('0x')
    ? taskId
    : ethers.keccak256(ethers.toUtf8Bytes(taskId));

  const task = await escrow.getTask(taskIdBytes32);

  return {
    requester: task.requester,
    worker: task.worker,
    payout: ethers.formatUnits(task.payout, 18),
    deadline: Number(task.deadline),
    status: ['NONE', 'FUNDED', 'RELEASED', 'REFUNDED'][Number(task.status)],
    resultHash: task.resultHash,
  };
}

/**
 * Generate a unique task ID (bytes32)
 */
export function generateTaskId(uniqueString: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(uniqueString));
}

/**
 * Switch to local Hardhat network in MetaMask
 */
export async function switchToLocalNetwork() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORK.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${NETWORK.chainId.toString(16)}`,
            chainName: 'Hardhat Local',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [NETWORK.rpcUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
