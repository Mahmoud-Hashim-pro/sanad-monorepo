import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { prisma } from "@sanad/database";

@ApiTags("Health & Status")
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Root API welcome and health check" })
  async getRoot() {
    return this.buildHealthPayload();
  }

  @Get("health")
  @ApiOperation({ summary: "Service health check (/health)" })
  async getRootHealth() {
    return this.buildHealthPayload();
  }

  @Get("api/v1/health")
  @ApiOperation({ summary: "Versioned API health check (/api/v1/health)" })
  async getVersionedHealth() {
    return this.buildHealthPayload();
  }

  private async buildHealthPayload() {
    const databaseConfigured = Boolean(process.env.DATABASE_URL);
    let dbConnected = false;
    let dbCounts: { roles: number; tenants: number; users: number; cases: number } | null = null;

    if (databaseConfigured) {
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

    return {
      status: "ok",
      service: "sanad-api",
      nameAr: "منصة سَنَد (SANAD) — الواجهة الخلفية (NestJS Modular Monolith)",
      version: "1.0.0",
      architecture: "Modular Monolith",
      databaseConfigured,
      dbConnected,
      tablesCount: 39,
      dbCounts,
      adminAccount: "eng.mhashim@gmail.com",
      endpoints: {
        docs: "/api/v1/docs",
        health: "/api/v1/health",
        tenants: "/api/v1/tenants",
        cases: "/api/v1/cases",
        authInitiate: "/api/v1/auth/initiate",
        authVerifyOtp: "/api/v1/auth/verify-otp",
        researchReview: "/api/v1/research/review",
        allocationsCalculate: "/api/v1/allocations/calculate",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
