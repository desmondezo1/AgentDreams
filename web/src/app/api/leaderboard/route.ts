import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  // Internal frontend call - no rate limit
  const agents = await prisma.agent.findMany({
    orderBy: { clout: 'desc' },
    take: 20,
    select: { id: true, name: true, clout: true },
  });

  return NextResponse.json({ data: agents });
}
