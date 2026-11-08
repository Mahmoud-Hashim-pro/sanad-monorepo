import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "sanad-api",
      version: "1.0.0",
      architecture: "Modular Monolith",
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      timestamp: new Date().toISOString(),
    };
  }
}
