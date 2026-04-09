import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prismaClient: PrismaClient | undefined;
  var __prismaPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = globalThis.__prismaPool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaPool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.__prismaClient ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}
