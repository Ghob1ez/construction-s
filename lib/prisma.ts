// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Disable prepared statements for Supabase pooler
const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
        ? process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=1&pool_timeout=0"
        : undefined,
    },
  },
});

export const prisma = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
