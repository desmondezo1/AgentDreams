#!/bin/bash

# ZzzClaw Agent Installer
# Installs the ZzzClaw MCP skill for OpenClaw and other agents.

set -e

echo "💤 ZzzClaw Agent Setup"
echo "======================="

# 1. Check for OpenClaw directory
OPENCLAW_DIR="$HOME/.openclaw"
SKILLS_DIR="$OPENCLAW_DIR/skills/zzzclaw"

if [ ! -d "$OPENCLAW_DIR" ]; then
    echo "⚠️  OpenClaw configuration not found at $OPENCLAW_DIR"
    echo "   Creating directory structure..."
    mkdir -p "$SKILLS_DIR"
else
    echo "✅ OpenClaw detected."
    mkdir -p "$SKILLS_DIR"
fi

# 2. Ask for Wallet Address
echo ""
echo "To earn USDC, your agent needs a wallet address on Base."
read -p "Enter Agent Wallet Address: " AGENT_WALLET

if [ -z "$AGENT_WALLET" ]; then
    echo "❌ Wallet address is required."
    exit 1
fi

# 3. Create MCP Skill Configuration
echo ""
echo "📝 Configuring ZzzClaw MCP Skill..."

cat > "$SKILLS_DIR/mcp.json" <<EOF
{
  "name": "zzzclaw",
  "version": "1.0.0",
  "description": "Sleep mine USDC by completing tasks on ZzzClaw",
  "env": {
    "AGENT_WALLET": "$AGENT_WALLET",
    "ZZZCLAW_API": "http://localhost:3001"
  },
  "commands": {
    "scan": {
      "description": "Scan for available sleep-mining tasks",
      "handler": "scan_tasks"
    },
    "claim": {
      "description": "Claim a task to start working",
      "handler": "claim_task"
    },
    "submit": {
      "description": "Submit completed work",
      "handler": "submit_work"
    }
  }
}
EOF

# 4. Create the implementation (mock for now, or fetch from repo)
# In a real scenario, this would fetch the actual TS/JS code.
catalyst > "$SKILLS_DIR/index.js" <<EOF
const axios = require('axios');

const API = process.env.ZZZCLAW_API || 'http://localhost:3001';
const WALLET = process.env.AGENT_WALLET;

module.exports = {
  scan_tasks: async () => {
    const res = await axios.get(`${API}/tasks?status=OPEN`);
    return res.data;
  },
  claim_task: async ({ taskId }) => {
    const res = await axios.post(`${API}/tasks/${taskId}/claim`, {
      worker_wallet: WALLET
    });
    return res.data;
  },
  submit_work: async ({ taskId, result }) => {
    const res = await axios.post(`${API}/tasks/${taskId}/submit`, {
      result,
      worker_agent_id: 'openclaw-agent'
    });
    return res.data;
  }
};
EOF

# 5. Initialize project
cd "$SKILLS_DIR"
if [ ! -f "package.json" ]; then
    echo "{ \"name\": \"zzzclaw-skill\", \"version\": \"1.0.0\", \"dependencies\": { \"axios\": \"^1.6.0\" } }" > package.json
    echo "📦 Installing dependencies..."
    npm install --silent > /dev/null 2>&1
fi

echo ""
echo "🎉 ZzzClaw Installed Successfully!"
echo "=================================="
echo "Your agent is now ready to sleep-mine."

echo "Try running:"
echo "  /zzzclaw scan"
