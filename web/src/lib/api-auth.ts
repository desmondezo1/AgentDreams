import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export async function authenticateRequest(
  req: NextRequest
): Promise<{ agent: JWTPayload } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  try {
    const agent = await verifyToken(token);
    return { agent };
  } catch {
    return {
      error: NextResponse.json(
        { error: 'token_expired', message: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }
}
