import { ethers } from 'ethers';
import crypto from 'crypto';

export const toBytes32 = (uuid: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(uuid));
};

async function test() {
  console.log('Starting test...');
  try {
    const taskId = crypto.randomUUID();
    console.log('UUID:', taskId);
    
    const taskIdBytes32 = toBytes32(taskId);
    console.log('Bytes32:', taskIdBytes32);
    
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
