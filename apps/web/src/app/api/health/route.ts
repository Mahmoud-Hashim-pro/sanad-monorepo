import { NextResponse } from "next/server";

export async function GET() {
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({
    status: "ok",
    platform: "SANAD",
    databaseUrlConfigured,
    mode: databaseUrlConfigured ? "postgresql_ready" : "interactive_persistence",
    tablesCount: 39,
    timestamp: new Date().toISOString(),
  });
}
