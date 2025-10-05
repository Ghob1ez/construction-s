// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withPoolerParams(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}pgbouncer=true&connection_limit=1&pool_timeout=0`;
}

const prismaClient =
  globalForPrisma.prisma ??
  (() => {
    const url = process.env.DATABASE_URL;

    // ✅ Only override the datasource URL if we actually have one
    if (url) {
      return new PrismaClient({
        datasources: { db: { url: withPoolerParams(url) } },
      });
    }

    // ✅ Otherwise, construct normally (Prisma will read from env at runtime)
    return new PrismaClient();
  })();

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}
