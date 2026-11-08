import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health/health.controller";
import { PlatformController } from "./modules/platform/platform.controller";
import { PlatformService } from "./modules/platform/platform.service";
import { AllocationDomainService } from "./modules/allocations/allocation.service";

/**
 * SANAD Modular Monolith Root Module (Sprint 1 Foundation)
 * Enforces strict separation between Presentation (Controllers), Application (Use-Cases),
 * Domain (Entities/Policies), and Persistence (Prisma Repositories).
 */
@Module({
  imports: [],
  controllers: [HealthController, PlatformController],
  providers: [AllocationDomainService, PlatformService],
})
export class AppModule {}
