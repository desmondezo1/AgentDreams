export interface Task {
  id: string;
  task_id_bytes32: string;
  title: string;
  spec: string;
  payout_usdc: string;
  deadline_at: string;
  verification_mode: 'AUTO' | 'REQUESTER' | 'VALIDATORS';
  status: 'DRAFT' | 'OPEN' | 'CLAIMED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PAID' | 'REFUNDED' | 'FAILED';
  requester_wallet: string;
  worker_wallet?: string;
  escrow_contract_address?: string;
  escrow_tx_hash?: string;
  release_tx_hash?: string;
  refund_tx_hash?: string;
  result_hash?: string;
  created_at: string;
}

export interface EventStreamItem {
  id: string;
  type: string;
  task_id: string;
  actor_agent_id?: string;
  data_json: any;
  created_at: string;
}
