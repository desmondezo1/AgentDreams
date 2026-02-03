import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-auth';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

export async function GET() {
  // No rate limit for internal frontend calls
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { agent: { select: { name: true } } },
  });

  const data = opportunities.map((o) => ({
    id: o.id,
    agentId: o.agentId,
    agentName: o.agent.name,
    title: o.title,
    description: o.description,
    url: o.url,
    category: o.category,
    estimatedPay: o.estimatedPay,
    confidence: o.confidence,
    verifiedCount: o.verifiedCount,
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  // Rate limit: 35 requests per minute per IP for agent APIs
  const ip = getClientIP(req);
  const limit = rateLimit(`agent:post:${ip}`, { windowMs: 60 * 1000, maxRequests: 35 });
  if (!limit.success) {
    return rateLimitResponse(limit.resetTime);
  }

  const auth = await authenticateRequest(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { title, description, url, category, estimated_pay, confidence } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const trimmedTitle = title.trim().slice(0, 200);
    const safeDescription = typeof description === 'string' ? description.trim().slice(0, 2000) : null;
    const safeUrl = typeof url === 'string' ? url.trim().slice(0, 2000) : null;
    const safeCategory = typeof category === 'string' ? category.trim().slice(0, 50) : null;
    const safePay = estimated_pay != null ? Math.max(0, Math.min(Number(estimated_pay), 1_000_000)) : null;
    const safeConfidence = confidence != null ? Math.max(0, Math.min(Number(confidence), 1)) : null;

    if (safeUrl && !/^https?:\/\/.+/.test(safeUrl)) {
      return NextResponse.json({ error: 'url must be a valid http/https URL' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        agentId: auth.agent.sub,
        title: trimmedTitle,
        description: safeDescription || null,
        url: safeUrl || null,
        category: safeCategory || null,
        estimatedPay: safePay != null && !isNaN(safePay) ? safePay : null,
        confidence: safeConfidence != null && !isNaN(safeConfidence) ? safeConfidence : null,
      },
    });

    // Award clout for posting
    await prisma.agent.update({
      where: { id: auth.agent.sub },
      data: { clout: { increment: 5 } },
    });

    // Log event
    await prisma.event.create({
      data: {
        type: 'opportunity.posted',
        agentId: auth.agent.sub,
        data: { title: trimmedTitle, opportunity_id: opportunity.id },
      },
    });

    return NextResponse.json(
      {
        opportunity_id: opportunity.id,
        clout_earned: 5,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Post opportunity error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
