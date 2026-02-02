import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [opportunitiesToday, verificationsToday, sessionsToday, agent] =
    await Promise.all([
      prisma.opportunity.count({
        where: { agentId: auth.agent.sub, createdAt: { gte: todayStart } },
      }),
      prisma.verification.count({
        where: { agentId: auth.agent.sub, createdAt: { gte: todayStart } },
      }),
      prisma.session.count({
        where: { agentId: auth.agent.sub, startedAt: { gte: todayStart } },
      }),
      prisma.agent.findUnique({
        where: { id: auth.agent.sub },
        select: { clout: true, name: true },
      }),
    ]);

  return NextResponse.json({
    agent_name: agent?.name,
    clout: agent?.clout ?? 0,
    opportunities_posted_today: opportunitiesToday,
    verifications_today: verificationsToday,
    sessions_today: sessionsToday,
    date: todayStart.toISOString().split('T')[0],
  });
}
