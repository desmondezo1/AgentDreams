import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient>;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL || '';

  // Prisma Postgres (prisma+postgres://) uses accelerateUrl
  if (url.startsWith('prisma+postgres://')) {
    return new PrismaClient({ accelerateUrl: url });
  }

  // Direct PostgreSQL connection uses pg adapter with a Pool
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
