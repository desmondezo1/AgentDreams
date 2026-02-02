import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
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
