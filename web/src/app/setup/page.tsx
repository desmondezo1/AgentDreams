'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';

export default function SetupPage() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  async function addLocalhostNetwork() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setMessage('❌ MetaMask not found');
      return;
    }

    setLoading(true);
    setMessage('Adding Localhost network...');

    try {
      // Try to switch to the network first
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 in hex
      });
      setMessage('✅ Switched to Localhost network');
    } catch (switchError: any) {
      // If the network doesn't exist (error 4902), add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69', // 31337 in hex
                chainName: 'Localhost',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
          setMessage('✅ Localhost network added and switched successfully!');
        } catch (addError: any) {
          console.error('Failed to add network:', addError);
          setMessage(`❌ Failed to add network: ${addError.message}`);
        }
      } else {
        console.error('Failed to switch network:', switchError);
        setMessage(`❌ Failed to switch network: ${switchError.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function checkBalances() {
    if (!address || !publicClient || chainId !== 31337) return;

    setLoading(true);
    try {
      const contracts = getContractAddresses(chainId);

      // Check ETH balance
      const eth = await publicClient.getBalance({ address });
      setEthBalance(formatUnits(eth, 18));

      // Check USDC balance
      const usdc = await publicClient.readContract({
        address: contracts.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setUsdcBalance(formatUnits(usdc as bigint, 18));

      setMessage('✅ Balances loaded');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function mintUSDC() {
    if (!walletClient || !address || chainId !== 31337) {
      setMessage('❌ Please connect to Localhost network (Chain ID: 31337)');
      return;
    }

    setLoading(true);
    setMessage('Minting 1000 USDC...');

    try {
      const contracts = getContractAddresses(chainId);
      const amount = parseUnits('1000', 18);

      const hash = await walletClient.writeContract({
        address: contracts.USDC as `0x${string}`,
        abi: [
          {
            type: 'function',
            name: 'mint',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: []
          }
        ],
        functionName: 'mint',
        args: [address, amount],
        gas: BigInt(100000), // Set reasonable gas limit
      });

      setMessage(`⏳ Waiting for confirmation...`);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setMessage(`✅ Successfully minted 1000 USDC! Tx: ${hash.substring(0, 10)}...`);

      // Refresh balances
      setTimeout(checkBalances, 1000);
    } catch (err: any) {
      console.error('Mint failed:', err);
      setMessage(`❌ Mint failed: ${err.message || err.shortMessage || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '1rem',
          background: 'linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🛠️ Local Development Setup
        </h1>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            1. Add Localhost Network
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            First, add the Hardhat Localhost network to MetaMask (Chain ID: 31337)
          </p>
          <button
            onClick={addLocalhostNetwork}
            disabled={loading}
            style={{
              background: 'var(--accent-purple)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Adding Network...' : 'Add Localhost Network to MetaMask'}
          </button>
        </div>

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            2. Connect Your Wallet
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            After adding the network, connect your wallet
          </p>
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                3. Check Your Balances
              </h2>

              {chainId !== 31337 && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--accent-red)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  ⚠️ You're on chain {chainId}. Please switch to Localhost (31337)
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Address: <code>{address}</code>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  ETH Balance: <strong>{ethBalance} ETH</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  USDC Balance: <strong>{usdcBalance} USDC</strong>
                </div>
              </div>

              <button
                onClick={checkBalances}
                disabled={loading || chainId !== 31337}
                style={{
                  background: 'var(--accent-cyan)',
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: loading || chainId !== 31337 ? 'not-allowed' : 'pointer',
                  opacity: loading || chainId !== 31337 ? 0.5 : 1
                }}
              >
                {loading ? 'Loading...' : 'Refresh Balances'}
              </button>
            </div>

            <div style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                4. Get Test USDC
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Mint 1000 test USDC tokens to your wallet for testing
              </p>

              <button
                onClick={mintUSDC}
                disabled={loading || chainId !== 31337}
                style={{
                  background: 'var(--accent-green)',
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: loading || chainId !== 31337 ? 'not-allowed' : 'pointer',
                  opacity: loading || chainId !== 31337 ? 0.5 : 1
                }}
              >
                {loading ? 'Minting...' : 'Mint 1000 USDC'}
              </button>
            </div>

            {message && (
              <div style={{
                padding: '1rem',
                background: message.includes('❌')
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(6, 182, 212, 0.1)',
                border: `1px solid ${message.includes('❌') ? 'var(--accent-red)' : 'var(--accent-cyan)'}`,
                borderRadius: '4px',
                marginBottom: '1.5rem'
              }}>
                {message}
              </div>
            )}
          </>
        )}

        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            📝 MetaMask Setup Instructions
          </h2>
          <ol style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Add Localhost Network:</strong>
              <ul style={{ marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                <li>Network Name: Localhost</li>
                <li>RPC URL: http://127.0.0.1:8545</li>
                <li>Chain ID: 31337</li>
                <li>Currency Symbol: ETH</li>
              </ul>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Import Test Account (Optional):</strong>
              <br />
              Use this private key: <code style={{ fontSize: '0.75rem' }}>0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80</code>
              <br />
              <small>(Account #0 from Hardhat with 10000 ETH)</small>
            </li>
            <li>
              <strong>Get Test Tokens:</strong> Use the "Mint 1000 USDC" button above
            </li>
          </ol>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a
            href="/feed"
            style={{
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            ← Back to Feed
          </a>
        </div>
      </div>
    </div>
  );
}
