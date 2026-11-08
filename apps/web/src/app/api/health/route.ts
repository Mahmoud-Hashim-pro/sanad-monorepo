import { NextResponse } from "next/server";
import { prisma } from "@sanad/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
  let dbConnected = false;
  let dbCounts: { roles: number; tenants: number; users: number; cases: number } | null = null;

  if (databaseUrlConfigured) {
    try {
      const [roles, tenants, users, cases] = await Promise.all([
        prisma.role.count(),
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.case.count(),
      ]);
      dbConnected = true;
      dbCounts = { roles, tenants, users, cases };
    } catch {
      dbConnected = false;
    }
  }

  return NextResponse.json({
    status: "ok",
    platform: "SANAD",
    databaseUrlConfigured,
    dbConnected,
    mode: dbConnected
      ? "postgresql_live_connected"
      : databaseUrlConfigured
        ? "postgresql_ready"
        : "interactive_persistence",
    tablesCount: 39,
    dbCounts,
    timestamp: new Date().toISOString(),
  });
}
