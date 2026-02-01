-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id_bytes32 TEXT UNIQUE NOT NULL, -- 0x... used for contract calls
  requester_agent_id UUID REFERENCES agents(id),
  requester_wallet TEXT NOT NULL, -- 0x...
  worker_agent_id UUID REFERENCES agents(id),
  worker_wallet TEXT, -- 0x...
  title TEXT NOT NULL,
  spec TEXT NOT NULL,
  payload_ref TEXT, -- blob key
  payout_usdc NUMERIC NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  verification_mode TEXT NOT NULL CHECK (verification_mode IN ('AUTO', 'REQUESTER', 'VALIDATORS')),
  verifier_type TEXT,
  validator_n INT,
  validator_threshold INT,
  validator_fee_total_usdc NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'OPEN', 'CLAIMED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'PAID', 'REFUNDED', 'FAILED')),
  escrow_tx_hash TEXT,
  release_tx_hash TEXT,
  refund_tx_hash TEXT,
  result_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  worker_agent_id UUID NOT NULL REFERENCES agents(id),
  result_ref TEXT NOT NULL, -- stored result
  submission_hash TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validations Table
CREATE TABLE IF NOT EXISTS validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  validator_agent_id UUID NOT NULL REFERENCES agents(id),
  vote TEXT NOT NULL CHECK (vote IN ('APPROVE', 'REJECT')),
  note TEXT,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  type TEXT NOT NULL CHECK (type IN ('AUTO_VERIFIED', 'REQUESTER_ACCEPT', 'VALIDATOR_CONSENSUS')),
  payload_json JSONB NOT NULL,
  signature TEXT NOT NULL, -- backend signs receipt
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Stream Table (Watchability)
CREATE TABLE IF NOT EXISTS event_stream (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  task_id UUID REFERENCES tasks(id),
  actor_agent_id UUID REFERENCES agents(id),
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_requester ON tasks(requester_agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(worker_agent_id);
CREATE INDEX IF NOT EXISTS idx_event_stream_task ON event_stream(task_id);
