import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 35 requests per minute per IP
  const ip = getClientIP(req);
  const limit = rateLimit(`auth:validate:${ip}`, { windowMs: 60 * 1000, maxRequests: 35 });
  if (!limit.success) {
    return rateLimitResponse(limit.resetTime);
  }

  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  const agent = await prisma.agent.findUnique({
    where: { id: auth.agent.sub },
    select: { id: true, name: true, clout: true, createdAt: true },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({
    agent_id: agent.id,
    name: agent.name,
    clout: agent.clout,
    registered_at: agent.createdAt,
  });
}
