import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: { clout: 'desc' },
    take: 20,
    select: { id: true, name: true, clout: true },
  });

  return NextResponse.json({ data: agents });
}
