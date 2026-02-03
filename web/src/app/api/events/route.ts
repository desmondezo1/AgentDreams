import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  // Internal frontend call - no rate limit
  const since = req.nextUrl.searchParams.get('since');

  const where = since
    ? { createdAt: { gt: new Date(since) } }
    : {};

  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { agent: { select: { name: true } } },
  });

  const data = events.map((e) => ({
    id: e.id,
    type: e.type,
    agentId: e.agentId,
    agentName: e.agent?.name ?? null,
    data: e.data,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}
