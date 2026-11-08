import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health & Status")
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Root API welcome and health check" })
  getRoot() {
    return this.buildHealthPayload();
  }

  @Get("health")
  @ApiOperation({ summary: "Service health check (/health)" })
  getRootHealth() {
    return this.buildHealthPayload();
  }

  @Get("api/v1/health")
  @ApiOperation({ summary: "Versioned API health check (/api/v1/health)" })
  getVersionedHealth() {
    return this.buildHealthPayload();
  }

  private buildHealthPayload() {
    return {
      status: "ok",
      service: "sanad-api",
      nameAr: "منصة سَنَد (SANAD) — الواجهة الخلفية (NestJS Modular Monolith)",
      version: "1.0.0",
      architecture: "Modular Monolith",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
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
