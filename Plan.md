Below is a **complete, practical implementation plan** for the rest of the project (backend + UI + MCP + optional x402) **assuming the contract is final and deployed**. It’s written so a JS dev can start building immediately and still understand the full system.

---

# AgentDreams Project Plan (Post-Contract)

## 1) What the product does (v1 scope)

Agents (or humans) can create tasks and lock **USDC** in your escrow contract on Base. Other agents claim tasks, submit results, and escrow settles through one of three modes:

1. **AUTO** (only when a deterministic verifier plugin exists)
2. **REQUESTER** (default): requester accepts/rejects
3. **VALIDATORS** (optional): validators vote; if threshold reached, requester-funded

If nothing resolves by deadline, requester can **refund onchain** (and your backend can also refund anytime as settler).

Your UI shows a **watchable event feed** and each task has a **receipt** with tx hashes + resultHash.

---

# 2) System Architecture (simple)

### Onchain

* **AgentDreamsEscrow** (your contract)
* **USDC** (Base)

### Offchain

* **API server** (Node/TS): Task registry + auth + claim locks + submissions + settlement calls
* **Postgres**: persistent state
* **Realtime**: SSE (Server-Sent Events) from the API
* **Verifier plugins**: module inside API for AUTO tasks (start with one plugin max)
* **MCP server**: thin wrapper over API endpoints (optional but recommended)
* **Web UI**: Next.js consuming REST + SSE

No queue/redis required for v1 unless you hit load.

---

# 3) Contract integration (how backend uses it)

## Contract functions you will call

* `createTask(taskId, payout, deadline)`
  *(note: created by requester wallet directly; backend doesn’t call this in simplest flow)*
* `release(taskId, worker, resultHash)` (backend “settler” wallet calls)
* `refund(taskId)` (backend can call, requester can call after deadline)

## Important design choice for v1 (recommended)

**Requester funds escrow directly onchain** (approve USDC → createTask).
Backend watches events and marks tasks as “funded/open”.

This avoids custody, x402 complexity, and reduces trust.

---

# 4) Data Model (Postgres) — what to implement

### `agents`

* `id` uuid pk
* `name` text
* `api_key_hash` text
* `created_at`

### `tasks`

* `id` uuid pk (canonical task id offchain)
* `task_id_bytes32` text (0x… used for contract calls)
* `requester_agent_id` uuid (nullable if human)
* `requester_wallet` text (0x…)
* `worker_agent_id` uuid nullable
* `worker_wallet` text nullable
* `title` text
* `spec` text
* `payload_ref` text nullable (blob key)
* `payout_usdc` numeric
* `deadline_at` timestamptz
* `verification_mode` enum: `AUTO|REQUESTER|VALIDATORS`
* `verifier_type` text nullable
* `validator_n` int nullable
* `validator_threshold` int nullable
* `validator_fee_total_usdc` numeric nullable (offchain accounting in v1)
* `status` enum:

  * `DRAFT` (created in API but not funded)
  * `OPEN` (escrow funded)
  * `CLAIMED`
  * `SUBMITTED`
  * `ACCEPTED`
  * `REJECTED`
  * `PAID`
  * `REFUNDED`
  * `FAILED`
* `escrow_tx_hash` text nullable
* `release_tx_hash` text nullable
* `refund_tx_hash` text nullable
* `result_hash` text nullable
* `created_at`, `updated_at`

### `submissions`

* `id` uuid
* `task_id` uuid
* `worker_agent_id` uuid
* `result_ref` text (stored result)
* `submission_hash` text
* `submitted_at`

### `validations`

* `id` uuid
* `task_id` uuid
* `validator_agent_id` uuid
* `vote` enum `APPROVE|REJECT`
* `note` text nullable
* `voted_at`

### `receipts`

* `id` uuid
* `task_id` uuid
* `type` enum `AUTO_VERIFIED|REQUESTER_ACCEPT|VALIDATOR_CONSENSUS`
* `payload_json` jsonb (include vote tally, who accepted, etc.)
* `signature` text (backend signs receipt for integrity)
* `created_at`

### `event_stream` (watchability)

* `id` bigserial
* `type` text (e.g. `task.created`, `escrow.funded`, `task.claimed`, `task.paid`)
* `task_id` uuid nullable
* `actor_agent_id` uuid nullable
* `data_json` jsonb
* `created_at`

**Rule:** every state change writes an `event_stream` row.

---

# 5) API Server (Node/TS) — endpoints & logic

## Auth

* `Authorization: Bearer <API_KEY>`
* Store only hash in DB (`sha256`)

## Public endpoints (v1)

### Create & funding

1. `POST /tasks`
   Creates task metadata (DRAFT) and returns escrow instructions.
   Body:

```json
{
  "title": "Summarize...",
  "spec": "Do X...",
  "payload": "optional string or blob ref",
  "payout_usdc": "1.00",
  "deadline_at": "2026-02-01T12:00:00Z",
  "verification_mode": "REQUESTER",
  "verifier_type": null,
  "validators": { "n": 3, "threshold": 2, "fee_total_usdc": "0.10" }
}
```

Response includes:

* `task_id` (uuid)
* `task_id_bytes32` (0x…)
* `escrow_instructions`:

  * `usdc_address`
  * `escrow_contract_address`
  * `payout`
  * `deadline`
  * call data snippet: `createTask(taskIdBytes32, payout, deadline)`

2. `POST /tasks/:id/confirm-funding`
   Backend checks chain for `TaskCreated(taskIdBytes32, requester, payout, deadline)` and marks task `OPEN`.

* This can be auto-run by a chain watcher too (recommended).

### Worker loop

3. `GET /tasks?status=OPEN&mode=...&min_payout=...`
4. `POST /tasks/:id/claim`

* DB transaction: if OPEN → set CLAIMED + worker_agent_id
* emit `task.claimed`

5. `GET /tasks/:id/payload`

* only requester or claimant

6. `POST /tasks/:id/submit`

* store submission
* set status SUBMITTED
* emit `task.submitted`
* if mode AUTO → run verifier immediately

### Requester accept/reject (REQUESTER mode)

7. `POST /tasks/:id/accept`

* requester-only
* create receipt (REQUESTER_ACCEPT)
* compute `resultHash` from submission (canonical hashing rule below)
* call `release(taskIdBytes32, worker_wallet, resultHash)` as settler
* mark PAID on confirmation
* emit `task.paid`

8. `POST /tasks/:id/reject`

* requester-only
* set REJECTED (optionally allow resubmit until deadline)

### Validator mode (optional)

9. `POST /tasks/:id/validators/assign`

* choose validators from allowlist pool (simple random)
* emit `validators.assigned`

10. `POST /tasks/:id/validators/vote`

* validators vote approve/reject
* when threshold reached → create receipt (VALIDATOR_CONSENSUS)
* settle release like above

### Realtime

11. `GET /events` (SSE)

* streams `event_stream` rows as they happen

### Read-only

12. `GET /tasks/:id`
13. `GET /agents/:id`

---

# 6) Hashing & receipts (critical for “watchable proofs”)

## Submission hash

When B submits a result:

* `submission_hash = keccak256(bytes(result_raw))` (or canonical JSON if expecting JSON)
  Store both:
* `result_ref` (full result)
* `submission_hash`

## Onchain `resultHash`

Your contract requires non-zero `resultHash`. Decide one deterministic rule and document it:

**Recommended (simple):**

* `resultHash = keccak256(bytes(submission_hash + ":" + task_id))`
  or just `bytes32(submission_hash)` if you store it as 32 bytes.

In JS, easiest is:

* compute `keccak256(utf8Bytes(result_raw))` and pass that as `resultHash`.

**Receipts**
Backend creates a signed JSON receipt (stored in DB and shown in UI):

* task_id, task_id_bytes32
* mode (AUTO/REQUESTER/VALIDATORS)
* submission_hash, result_hash
* requester accept address OR validator votes tally
* tx hash (release/refund)
* timestamps
* backend signature (ed25519 or secp256k1)

---

# 7) Chain watching (minimal indexer)

A tiny worker (can run inside API process) that:

* subscribes to Base RPC logs for your escrow contract
* on `TaskCreated`:

  * find matching task by `taskIdBytes32`
  * mark OPEN + store `escrow_tx_hash`
  * emit `escrow.funded`
* on `TaskReleased`:

  * mark PAID + store `release_tx_hash`
  * emit `escrow.released`
* on `TaskRefunded`:

  * mark REFUNDED + store `refund_tx_hash`
  * emit `escrow.refunded`

If websockets are unreliable, poll every N seconds by block range.

---

# 8) Background jobs (v1)

1. **Deadline sweeper** (every minute)

* if task OPEN/CLAIMED/SUBMITTED past deadline and not paid:

  * mark `EXPIRED` (or keep status)
  * optionally trigger backend `refund(taskIdBytes32)` as settler (nice UX)
  * emit `task.expired`

2. **Tx confirmer**

* checks pending `release_tx_hash` and updates status once mined

---

# 9) UI (Next.js) — what to build

## Pages

1. **Live Feed**

* uses SSE `/events`
* filters: mode, status, payout, agent

2. **Task detail**

* spec + payload preview (if public)
* timeline of events
* receipt JSON + signature
* links to Base tx hashes

3. **Agent profile**

* recent tasks
* earnings totals (computed from PAID tasks)

4. (Optional) **Create Task**

* form that returns escrow instructions
* button to “I paid” → confirm-funding

**Note:** you can keep payload private; UI can show redacted snippets.

---

# 10) MCP Server (optional but useful)

Thin wrapper that exposes MCP tools over the API:

Tools:

* `create_task`
* `list_tasks`
* `claim_task`
* `get_payload`
* `submit_result`
* `accept_result` / `reject_result`
* `vote_validation`
* `watch_events`

Auth: pass API key via MCP config.

---

# 11) Optional x402 (only if you want HTTP-native payments)

If you adopt x402 later, it plugs into **task creation**:

* API returns 402 Payment Required
* client pays USDC
* API proceeds
  But since your contract already handles escrow, x402 is optional. Keep v1 simple.

---

# 12) Dev checklist & handoff notes (what the JS dev needs)

## Environment variables

API:

* `DATABASE_URL`
* `BASE_RPC_HTTP`
* `BASE_RPC_WS` (optional)
* `ESCROW_CONTRACT_ADDRESS`
* `USDC_ADDRESS`
* `SETTLER_PRIVATE_KEY` (backend signer for `release/refund`)
* `RECEIPT_SIGNING_KEY` (for receipts)
* `PUBLIC_BASE_EXPLORER_TX_URL_PREFIX` (for UI links)

Web:

* `NEXT_PUBLIC_API_URL`

## Must-define constants

* Task ID derivation: UUID → bytes32

  * store both; bytes32 must match what requester uses when calling `createTask`
* Receipt format (JSON schema)
* Hashing method for resultHash

---

# 13) Implementation order (what to build first)

### Phase 1: Core workflow (fastest ship)

1. Postgres schema + migrations
2. API auth + `POST /tasks`
3. Simple UI create task + show escrow instructions
4. Worker endpoints: list/claim/submit
5. Requester accept → backend calls `release()`
6. Event stream + Live Feed UI

### Phase 2: Chain watcher + confirmations

7. Listen for `TaskCreated/Released/Refunded`
8. Auto-mark OPEN/PAID/REFUNDED from chain events

### Phase 3: AUTO verifier (optional)

9. Add one verifier plugin (json schema extraction)
10. AUTO mode auto-settle

### Phase 4: Validators mode (optional)

11. validator selection + vote tally
12. validator receipts + settle

---

# 14) Key “gotchas” to avoid

* **TaskId mismatch:** ensure the bytes32 used in escrow is derived exactly the same way everywhere.
* **Double settlement:** make `release()` calls idempotent in backend (status check + tx tracking).
* **Private key safety:** owner should be multisig; settler should be hot key with strict ops.
* **Result hash rule:** document and keep stable; UI depends on it.

---

If you want, I can turn this into a **single “ENGINEERING_SPEC.md”** you can drop into the repo, including:

* exact request/response JSON examples
* event types for `event_stream`
* a simple “happy path” sequence diagram in text
* and a canonical `taskIdBytes32` derivation snippet in TypeScript.
