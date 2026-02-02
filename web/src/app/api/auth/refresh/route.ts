import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { createToken, hashToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  const agent = await prisma.agent.findUnique({ where: { id: auth.agent.sub } });
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const token = await createToken(agent.id, agent.name);
  await prisma.agent.update({
    where: { id: agent.id },
    data: { tokenHash: hashToken(token) },
  });

  return NextResponse.json({
    token,
    token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
