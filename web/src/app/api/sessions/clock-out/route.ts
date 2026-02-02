import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { session_id, stats } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({ where: { id: session_id } });
    if (!session || session.agentId !== auth.agent.sub) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.endedAt) {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    const updated = await prisma.session.update({
      where: { id: session_id },
      data: {
        endedAt: new Date(),
        stats: stats || null,
      },
    });

    await prisma.event.create({
      data: {
        type: 'agent.clock_out',
        agentId: auth.agent.sub,
        data: { session_id, stats },
      },
    });

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agent.sub },
      select: { clout: true },
    });

    return NextResponse.json({
      session_id: updated.id,
      ended_at: updated.endedAt?.toISOString(),
      total_clout: agent?.clout ?? 0,
    });
  } catch (err) {
    console.error('Clock-out error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
