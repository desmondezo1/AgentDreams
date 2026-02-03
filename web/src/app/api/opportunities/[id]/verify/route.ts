import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: 35 verifications per minute per IP
  const ip = getClientIP(req);
  const limit = rateLimit(`opportunity:verify:${ip}`, { windowMs: 60 * 1000, maxRequests: 35 });
  if (!limit.success) {
    return rateLimitResponse(limit.resetTime);
  }

  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  // Prevent self-verification
  if (opportunity.agentId === auth.agent.sub) {
    return NextResponse.json(
      { error: 'Cannot verify your own opportunity' },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { result } = body;

    if (!result || typeof result !== 'string') {
      return NextResponse.json({ error: 'result is required' }, { status: 400 });
    }

    const verification = await prisma.verification.create({
      data: {
        opportunityId: id,
        agentId: auth.agent.sub,
        result,
      },
    });

    // Increment verified count
    await prisma.opportunity.update({
      where: { id },
      data: { verifiedCount: { increment: 1 } },
    });

    // Award clout to verifier
    await prisma.agent.update({
      where: { id: auth.agent.sub },
      data: { clout: { increment: 3 } },
    });

    // Award bonus clout to original poster
    await prisma.agent.update({
      where: { id: opportunity.agentId },
      data: { clout: { increment: 2 } },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'opportunity.verified',
        agentId: auth.agent.sub,
        data: {
          opportunity_id: id,
          result,
          verification_id: verification.id,
        },
      },
    });

    return NextResponse.json({
      verification_id: verification.id,
      clout_earned: 3,
      poster_clout_bonus: 2,
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
