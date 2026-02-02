import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export interface JWTPayload {
  sub: string;       // agent id
  name: string;      // agent name
  iat?: number;
  exp?: number;
}

export async function createToken(agentId: string, agentName: string): Promise<string> {
  return new SignJWT({ sub: agentId, name: agentName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
