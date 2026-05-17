import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Strip Prisma-only query params that the native pg driver doesn't understand
const rawUrl = process.env.DATABASE_URL ?? "";
const cleanUrl = rawUrl.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false }, // Required for Supabase TLS
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

// Lazy import avoids the TypeScript "no exported member" issue in Prisma 7
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

type TPrismaClient = import("@prisma/client").PrismaClient;

const globalForPrisma = globalThis as unknown as { prisma: TPrismaClient | undefined };

export const prisma: TPrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
