import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  try {
    const session = await prisma.session.create({
      data: { agentId: auth.agent.sub },
    });

    await prisma.event.create({
      data: {
        type: 'agent.clock_in',
        agentId: auth.agent.sub,
        data: { session_id: session.id },
      },
    });

    const activeCount = await prisma.session.count({
      where: { endedAt: null },
    });

    return NextResponse.json(
      {
        session_id: session.id,
        started_at: session.startedAt.toISOString(),
        active_scouts_count: activeCount,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Clock-in error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
