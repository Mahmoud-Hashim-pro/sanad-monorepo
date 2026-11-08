import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PlatformService } from "./platform.service";
import {
  RegisterAccountRequestDto,
  VerifyPhoneOtpRequestDto,
} from "../auth/auth.contracts";

@Controller()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get("tenants")
  listTenants() {
    return this.platformService.listTenants();
  }

  @Patch("tenants/:id/status")
  updateTenantStatus(
    @Param("id") id: string,
    @Body() body: { status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" },
  ) {
    return this.platformService.updateTenantStatus(id, body.status);
  }

  @Get("cases")
  listCases(@Query("tenantId") tenantId?: string) {
    return this.platformService.listCases(tenantId);
  }

  @Post("cases")
  createCase(
    @Body()
    body: {
      tenantId: string;
      beneficiaryNameAr: string;
      nationalId: string;
      category: string;
      titleAr: string;
      priorityLevel?: "HIGH" | "MEDIUM" | "LOW";
      requestedAmountEgp: number;
    },
  ) {
    return this.platformService.createCase(body);
  }

  @Post("research/review")
  reviewResearch(
    @Body()
    body: {
      caseId?: string;
      authorUserId: string;
      reviewerUserId: string;
      reviewerRole: string;
    },
  ) {
    return this.platformService.reviewResearch(body);
  }

  @Post("allocations/calculate")
  calculateAllocation(
    @Body()
    body: {
      donationStatus: string;
      restrictedCategory?: string | null;
      requestCategory: string;
      availableAmountEgp: number;
      reservedAmountEgp: number;
      requestedAllocationEgp: number;
    },
  ) {
    return this.platformService.calculateAllocation(body);
  }

  @Post("auth/initiate")
  initiateAuth(@Body() body: RegisterAccountRequestDto) {
    return this.platformService.initiateAuth(body);
  }

  @Post("auth/verify-otp")
  verifyOtp(@Body() body: VerifyPhoneOtpRequestDto) {
    return this.platformService.verifyOtp(body);
  }
}
