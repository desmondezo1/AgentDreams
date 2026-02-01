import { ethers } from 'ethers';
import { AGENT_DREAMS_ABI } from './abi';

export const toBytes32 = (uuid: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
};

export const getEscrowInstructions = (
  taskIdBytes32: string,
  payout: string,
  deadline: number,
  contractAddress: string,
  usdcAddress: string
) => {
  const iface = new ethers.Interface([
    'function createTask(bytes32 taskId, uint256 payout, uint64 deadline)'
  ]);

  const payoutWei = ethers.parseUnits(payout, 18); // MockUSDC has 18 decimals (real USDC = 6)
  const callData = iface.encodeFunctionData('createTask', [
    taskIdBytes32,
    payoutWei,
    deadline
  ]);

  return {
    usdc_address: usdcAddress,
    escrow_contract_address: contractAddress,
    payout_formatted: payout,
    payout_units: payoutWei.toString(),
    deadline,
    call_data: callData
  };
};

const getProvider = () => {
  const rpcUrl = process.env.BASE_RPC_HTTP || 'https://mainnet.base.org';
  return new ethers.JsonRpcProvider(rpcUrl);
};

const getSigner = () => {
  const provider = getProvider();
  const privateKey = process.env.SETTLER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SETTLER_PRIVATE_KEY not configured');
  }
  return new ethers.Wallet(privateKey, provider);
};

export const callRelease = async (
  taskIdBytes32: string,
  workerAddress: string,
  resultHash: string
): Promise<string> => {
  try {
    const signer = getSigner();
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }
    
    const contract = new ethers.Contract(contractAddress, AGENT_DREAMS_ABI, signer);
    const tx = await contract.release(taskIdBytes32, workerAddress, resultHash);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Release contract call failed:', error);
    throw error;
  }
};

export const callRefund = async (taskIdBytes32: string): Promise<string> => {
  try {
    const signer = getSigner();
    const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }
    
    const contract = new ethers.Contract(contractAddress, AGENT_DREAMS_ABI, signer);
    const tx = await contract.refund(taskIdBytes32);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Refund contract call failed:', error);
    throw error;
  }
};
