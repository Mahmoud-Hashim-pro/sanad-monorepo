import { Module } from '@nestjs/common';

/**
 * SANAD Modular Monolith Root Module (Sprint 1 Foundation)
 * Enforces strict separation between Presentation (Controllers), Application (Use-Cases),
 * Domain (Entities/Policies), and Persistence (Prisma Repositories).
 */
@Module({
  imports: [
    // AuthModule,
    // TenantsModule,
    // MembershipsModule,
    // BeneficiariesModule,
    // HouseholdsModule,
    // CasesModule,
    // ResearchModule,
    // DonorsModule,
    // DonationsModule,
    // AllocationsModule,
    // DeliveriesModule,
    // AuditModule,
  ],
})
export class AppModule {}
