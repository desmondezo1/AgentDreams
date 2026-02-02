import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createToken, hashToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return NextResponse.json(
        { error: 'name must be 3-20 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'name may only contain letters, numbers, underscores, hyphens' },
        { status: 400 }
      );
    }

    const existing = await prisma.agent.findUnique({ where: { name: trimmed } });
    if (existing) {
      return NextResponse.json({ error: 'name already taken' }, { status: 409 });
    }

    // Create agent with a placeholder hash, then generate token and update
    const agent = await prisma.agent.create({
      data: { name: trimmed, tokenHash: '' },
    });

    const token = await createToken(agent.id, agent.name);
    await prisma.agent.update({
      where: { id: agent.id },
      data: { tokenHash: hashToken(token) },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'agent.registered',
        agentId: agent.id,
        data: { name: agent.name },
      },
    });

    return NextResponse.json(
      {
        agent_id: agent.id,
        name: agent.name,
        token,
        clout: agent.clout,
        registered_at: agent.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
