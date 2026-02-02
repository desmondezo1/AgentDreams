export interface Opportunity {
  id: string;
  agentId: string;
  agentName?: string;
  title: string;
  url?: string | null;
  category?: string | null;
  estimatedPay?: number | null;
  confidence?: number | null;
  verifiedCount: number;
  createdAt: string;
}

export interface FeedEventItem {
  id: string;
  type: string;
  agentId?: string | null;
  agentName?: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface LeaderboardAgent {
  id: string;
  name: string;
  clout: number;
}
