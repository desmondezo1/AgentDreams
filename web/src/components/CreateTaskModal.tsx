"use client";

import React, { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseUnits, keccak256, toBytes } from 'viem';
import { USDC_ABI, AGENT_DREAMS_ABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';

type Step = 'wallet' | 'form' | 'approve' | 'fund' | 'confirm';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) => {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Form state
  const [step, setStep] = useState<Step>('wallet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');
  const [payout, setPayout] = useState('');

  // Transaction state
  const [approvalTxHash, setApprovalTxHash] = useState<string>('');
  const [fundingTxHash, setFundingTxHash] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset modal when opened
  React.useEffect(() => {
    if (isOpen) {
      console.log('Modal opened - Connection state:', { isConnected, address, chainId });
      if (isConnected) {
        setStep('form');
      } else {
        setStep('wallet');
      }
      setError('');
    }
  }, [isOpen, isConnected, address, chainId]);

  // Step 1: Validate form and proceed to approval
  async function handleFormSubmit() {
    if (!title || !description || !criteria || !payout) {
      setError("Please fill in all fields.");
      return;
    }

    if (parseFloat(payout) < 0.1) {
      setError("Minimum bounty is $0.1 USDC");
      return;
    }

    setError('');
    setStep('approve');
  }

  // Step 2: Approve USDC spending
  async function handleApprove() {
    console.log('handleApprove called - State:', { walletClient: !!walletClient, address, chainId, isConnected });

    if (!isConnected || !address || !chainId) {
      setError(`Wallet not connected. Please connect your wallet first. (Connected: ${isConnected}, Address: ${address}, ChainId: ${chainId})`);
      return;
    }

    // Validate network
    if (chainId !== 31337) {
      setError(`Please switch to Hardhat Local Network (Chain ID: 31337). You're currently on chain ${chainId}`);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Wait for walletClient to be ready (retry logic)
      let client = walletClient;
      let retries = 0;
      while (!client && retries < 10) {
        console.log(`Waiting for wallet client... attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        // Re-check walletClient by waiting a bit
        retries++;
      }

      if (!client) {
        // Try getting it from window.ethereum directly as fallback
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const { createWalletClient, custom } = await import('viem');
          client = createWalletClient({
            account: address as `0x${string}`,
            chain: { id: chainId, name: 'Localhost', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://127.0.0.1:8545'] }, public: { http: ['http://127.0.0.1:8545'] } } },
            transport: custom((window as any).ethereum)
          });
        } else {
          setError("Wallet client not ready. Please refresh the page and try again.");
          setProcessing(false);
          return;
        }
      }

      const contracts = getContractAddresses(chainId);
      const payoutAmount = parseUnits(payout, 18); // MockUSDC has 18 decimals

      console.log('Sending approval transaction...', { contracts, payoutAmount: payoutAmount.toString() });

      // Send approval transaction
      const hash = await client.writeContract({
        address: contracts.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contracts.AGENT_DREAMS_ESCROW as `0x${string}`, payoutAmount],
        gas: BigInt(100000), // Set reasonable gas limit
      });

      console.log('Approval tx sent:', hash);
      setApprovalTxHash(hash);

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setProcessing(false);
      setStep('fund');
    } catch (err: any) {
      console.error("Approval failed:", err);
      setError(err.message || "Failed to approve USDC. Please try again.");
      setProcessing(false);
    }
  }

  // Step 3: Fund escrow contract
  async function handleFund() {
    if (!isConnected || !address || !chainId) {
      setError("Wallet not connected");
      return;
    }

    // Validate network
    if (chainId !== 31337) {
      setError(`Please switch to Hardhat Local Network (Chain ID: 31337). You're currently on chain ${chainId}`);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Wait for walletClient to be ready (retry logic)
      let client = walletClient;
      let retries = 0;
      while (!client && retries < 10) {
        console.log(`Waiting for wallet client... attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!client) {
        // Try getting it from window.ethereum directly as fallback
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const { createWalletClient, custom } = await import('viem');
          client = createWalletClient({
            account: address as `0x${string}`,
            chain: { id: chainId, name: 'Localhost', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://127.0.0.1:8545'] }, public: { http: ['http://127.0.0.1:8545'] } } },
            transport: custom((window as any).ethereum)
          });
        } else {
          setError("Wallet client not ready. Please refresh the page and try again.");
          setProcessing(false);
          return;
        }
      }

      const contracts = getContractAddresses(chainId);

      // Generate task ID
      const generatedTaskId = crypto.randomUUID();
      setTaskId(generatedTaskId);

      // Convert task ID to bytes32
      const taskIdBytes32 = keccak256(toBytes(generatedTaskId));

      const payoutAmount = parseUnits(payout, 18);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now

      console.log('Sending createTask transaction...', { taskIdBytes32, payoutAmount: payoutAmount.toString(), deadlineTimestamp });

      // Call createTask on escrow contract
      const hash = await client.writeContract({
        address: contracts.AGENT_DREAMS_ESCROW as `0x${string}`,
        abi: AGENT_DREAMS_ABI,
        functionName: 'createTask',
        args: [taskIdBytes32, payoutAmount, BigInt(deadlineTimestamp)],
        gas: BigInt(500000), // Set reasonable gas limit
      });

      console.log('Fund tx sent:', hash);
      setFundingTxHash(hash);

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setProcessing(false);
      setStep('confirm');
    } catch (err: any) {
      console.error("Funding failed:", err);
      setError(err.message || "Failed to fund escrow. Please try again.");
      setProcessing(false);
    }
  }

  // Step 4: Save to database
  async function handleSaveToDatabase() {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          title,
          spec: `${description} [Validation: ${criteria}]`,
          payout_usdc: payout, // Keep as string for backend
          requester_wallet: address,
          verification_mode: 'AUTO',
          deadline_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          escrow_tx_hash: fundingTxHash,
        }),
      });

      if (response.ok) {
        // Clear form
        setTitle('');
        setDescription('');
        setCriteria('');
        setPayout('');
        setApprovalTxHash('');
        setFundingTxHash('');
        setTaskId('');
        setStep('wallet');

        // Close modal
        onClose();

        // Notify parent
        if (onTaskCreated) {
          onTaskCreated();
        }

        alert("✅ Bounty deployed successfully!");
      } else {
        const error = await response.json();
        setError(`Failed to save task: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Database save failed:", error);
      setError("Failed to save task. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay ${isOpen ? 'active' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Create New Bounty</span>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Connection Status Debug */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              padding: '0.5rem',
              marginBottom: '1rem',
              backgroundColor: 'rgba(100, 100, 100, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}>
              Connected: {isConnected ? '✅' : '❌'} | Address: {address?.substring(0, 10)}... | Chain: {chainId}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red)',
              borderRadius: '4px',
              color: 'var(--accent-red)',
              fontSize: '0.85rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Step 1: Wallet Connect */}
          {step === 'wallet' && (
            <div className="wallet-step">
              <span className="wallet-icon">🦊</span>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Connect Wallet
              </h3>
              <p className="wallet-text">
                To fund this bounty and interact with the AI Agent Network, you need to connect your crypto wallet.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ConnectButton />
              </div>
            </div>
          )}

          {/* Step 2: Task Form */}
          {step === 'form' && (
            <div>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sentiment Analysis on Crypto Tweets"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the task expectation clearly for the AI agents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Validation Criteria</label>
                <textarea
                  className="form-textarea"
                  placeholder="How will agents verify completion? e.g. Return JSON with accuracy > 95%"
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                />
                <span className="input-hint">Agents must match this to get paid.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Bounty Reward (USDC)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  min="0.1"
                  step="0.01"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                />
                <span className="input-hint">Minimum: $0.1 USDC</span>
              </div>
            </div>
          )}

          {/* Step 3: Approve USDC */}
          {step === 'approve' && (
            <div className="wallet-step">
              <span className="wallet-icon">💰</span>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Approve USDC Spending
              </h3>
              <p className="wallet-text">
                You need to approve the escrow contract to spend <strong>${payout} USDC</strong> on your behalf.
                This is a standard security step for all blockchain transactions.
              </p>
              {approvalTxHash && (
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '1rem' }}>
                  Transaction: {approvalTxHash.substring(0, 20)}...
                </p>
              )}
            </div>
          )}

          {/* Step 4: Fund Escrow */}
          {step === 'fund' && (
            <div className="wallet-step">
              <span className="wallet-icon">🔒</span>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Fund Escrow Contract
              </h3>
              <p className="wallet-text">
                Now we'll transfer <strong>${payout} USDC</strong> to the escrow contract.
                These funds will be held securely until an agent completes your task.
              </p>
              {fundingTxHash && (
                <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '1rem' }}>
                  Transaction: {fundingTxHash.substring(0, 20)}...
                </p>
              )}
            </div>
          )}

          {/* Step 5: Confirm & Save */}
          {step === 'confirm' && (
            <div className="wallet-step">
              <span className="wallet-icon">✅</span>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Escrow Funded Successfully!
              </h3>
              <p className="wallet-text">
                Your task has been funded on the blockchain. Click below to finalize and publish your bounty.
              </p>
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Task:</strong> {title}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Bounty:</strong> ${payout} USDC
                </div>
                <div>
                  <strong>Escrow TX:</strong>{' '}
                  <a
                    href={`https://sepolia.basescan.org/tx/${fundingTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}
                  >
                    {fundingTxHash.substring(0, 10)}...
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn"
            onClick={onClose}
            disabled={processing}
            style={{
              background: 'var(--bg-panel-light)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: processing ? 0.5 : 1
            }}
          >
            Cancel
          </button>

          {/* Form Step - Next Button */}
          {step === 'form' && (
            <button
              className="btn"
              onClick={handleFormSubmit}
              disabled={!title || !description || !criteria || !payout}
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: (!title || !description || !criteria || !payout) ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: (!title || !description || !criteria || !payout) ? 0.5 : 1
              }}
            >
              Next: Approve USDC
            </button>
          )}

          {/* Approve Step - Approve Button */}
          {step === 'approve' && (
            <button
              className="btn"
              onClick={handleApprove}
              disabled={processing}
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: processing ? 0.5 : 1
              }}
            >
              {processing ? (
                <>
                  <span className="spinner" style={{ marginRight: '8px' }}></span>
                  Approving...
                </>
              ) : (
                `Approve $${payout} USDC`
              )}
            </button>
          )}

          {/* Fund Step - Fund Button */}
          {step === 'fund' && (
            <button
              className="btn"
              onClick={handleFund}
              disabled={processing}
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: processing ? 0.5 : 1
              }}
            >
              {processing ? (
                <>
                  <span className="spinner" style={{ marginRight: '8px' }}></span>
                  Funding Escrow...
                </>
              ) : (
                `Fund Escrow ($${payout})`
              )}
            </button>
          )}

          {/* Confirm Step - Finalize Button */}
          {step === 'confirm' && (
            <button
              className="btn"
              onClick={handleSaveToDatabase}
              disabled={processing}
              style={{
                background: 'var(--accent-green)',
                color: '#000',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: processing ? 0.5 : 1
              }}
            >
              {processing ? (
                <>
                  <span className="spinner" style={{ marginRight: '8px' }}></span>
                  Publishing...
                </>
              ) : (
                'Publish Bounty'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
