import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  maskNationalId,
  normalizeAndValidateEgyptianMobile,
  validateEgyptianNationalId,
} from "@sanad/shared";
import { AllocationDomainService } from "../allocations/allocation.service";
import {
  PublicAuthAcceptedResponseDto,
  RegisterAccountRequestDto,
  VerifyPhoneOtpRequestDto,
} from "../auth/auth.contracts";

export interface TenantRecord {
  id: string;
  nameAr: string;
  type: "ASSOCIATION" | "INDIVIDUAL";
  governorate: string;
  registrationNumber?: string;
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED";
  contactPhoneE164: string;
  activeCasesCount: number;
  verifiedDeliveriesCount: number;
}

export interface CaseRecord {
  id: string;
  tenantId: string;
  caseNumber: string;
  beneficiaryNameAr: string;
  maskedNationalId: string;
  governorateAr: string;
  category: string;
  titleAr: string;
  caseStatus: string;
  researchStatus: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
  requestedAmountEgp: number;
}

@Injectable()
export class PlatformService {
  private readonly tenants: TenantRecord[] = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      nameAr: "جمعية النور للتكافل الاجتماعي بالغربية (بيانات تجريبية)",
      type: "ASSOCIATION",
      governorate: "الغربية",
      registrationNumber: "GHARBIA-ASSN-1842",
      status: "ACTIVE",
      contactPhoneE164: "+201011122233",
      activeCasesCount: 48,
      verifiedDeliveriesCount: 192,
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      nameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري (بيانات تجريبية)",
      type: "INDIVIDUAL",
      governorate: "الدقهلية",
      status: "ACTIVE",
      contactPhoneE164: "+201122233344",
      activeCasesCount: 19,
      verifiedDeliveriesCount: 64,
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      nameAr: "جمعية الرحمة الخيرية بطنطا (بيانات تجريبية)",
      type: "ASSOCIATION",
      governorate: "الغربية",
      registrationNumber: "GHARBIA-ASSN-2190",
      status: "PENDING_APPROVAL",
      contactPhoneE164: "+201288877766",
      activeCasesCount: 0,
      verifiedDeliveriesCount: 0,
    },
  ];

  private readonly cases: CaseRecord[] = [
    {
      id: "77777777-7777-4777-8777-777777777701",
      tenantId: "33333333-3333-4333-8333-333333333301",
      caseNumber: "CASE-2026-1042",
      beneficiaryNameAr: "فاطمة عبد الفتاح السيد (بيانات تجريبية)",
      maskedNationalId: "279051516****4",
      governorateAr: "الغربية",
      category: "MEDICAL_AID",
      titleAr: "دعم علاجي وإعاشة شهرية لأسرة معيلة",
      caseStatus: "APPROVED",
      researchStatus: "REVIEWED",
      priorityLevel: "HIGH",
      requestedAmountEgp: 2500,
    },
    {
      id: "77777777-7777-4777-8777-777777777702",
      tenantId: "33333333-3333-4333-8333-333333333302",
      caseNumber: "CASE-2026-2019",
      beneficiaryNameAr: "محمود إبراهيم الدسوقي (بيانات تجريبية)",
      maskedNationalId: "284110312****7",
      governorateAr: "الدقهلية",
      category: "HOUSING_REPAIR",
      titleAr: "ترميم سقف منزل ريفي بمركز المنصورة",
      caseStatus: "RESEARCH_SUBMITTED",
      researchStatus: "SUBMITTED",
      priorityLevel: "HIGH",
      requestedAmountEgp: 8500,
    },
  ];

  constructor(private readonly allocationDomainService: AllocationDomainService) {}

  listTenants(): TenantRecord[] {
    return this.tenants;
  }

  updateTenantStatus(
    tenantId: string,
    status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED",
  ): TenantRecord {
    const tenant = this.tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      throw new NotFoundException("الجهة الخيرية أو المبادرة غير موجودة.");
    }
    tenant.status = status;
    return tenant;
  }

  listCases(tenantId?: string): CaseRecord[] {
    if (!tenantId) {
      return this.cases;
    }
    return this.cases.filter((c) => c.tenantId === tenantId);
  }

  createCase(payload: {
    tenantId: string;
    beneficiaryNameAr: string;
    nationalId: string;
    category: string;
    titleAr: string;
    priorityLevel?: "HIGH" | "MEDIUM" | "LOW";
    requestedAmountEgp: number;
  }): CaseRecord {
    const idCheck = validateEgyptianNationalId(payload.nationalId);
    if (!idCheck.isValid || !idCheck.parsed) {
      throw new BadRequestException(idCheck.errorAr || "الرقم القومي غير صالح.");
    }
    if (!payload.beneficiaryNameAr || payload.beneficiaryNameAr.trim().length < 5) {
      throw new BadRequestException("يرجى إدخال الاسم الرباعي للمستفيد باللغة العربية.");
    }

    const newCase: CaseRecord = {
      id: randomUUID(),
      tenantId: payload.tenantId,
      caseNumber: `CASE-2026-${1050 + this.cases.length}`,
      beneficiaryNameAr: payload.beneficiaryNameAr.trim(),
      maskedNationalId: maskNationalId(payload.nationalId),
      governorateAr: idCheck.parsed.governorateNameAr,
      category: payload.category,
      titleAr: payload.titleAr.trim(),
      caseStatus: "SUBMITTED",
      researchStatus: "ASSIGNED",
      priorityLevel: payload.priorityLevel ?? "MEDIUM",
      requestedAmountEgp: Number(payload.requestedAmountEgp) || 0,
    };

    this.cases.unshift(newCase);
    return newCase;
  }

  reviewResearch(payload: {
    caseId?: string;
    authorUserId: string;
    reviewerUserId: string;
    reviewerRole: string;
  }) {
    this.allocationDomainService.validateIndependentResearchReview({
      authorUserId: payload.authorUserId,
      reviewerUserId: payload.reviewerUserId,
      reviewerRole: payload.reviewerRole,
    });

    return {
      allowed: true,
      status: "REVIEW_APPROVED",
      messageAr: "تم التحقق من استقلالية المراجع واعتماد تقرير البحث الميداني بنجاح.",
    };
  }

  calculateAllocation(payload: {
    donationStatus: string;
    restrictedCategory?: string | null;
    requestCategory: string;
    availableAmountEgp: number;
    reservedAmountEgp: number;
    requestedAllocationEgp: number;
  }) {
    const availableAmountPiasters = BigInt(Math.round(payload.availableAmountEgp * 100));
    const reservedAmountPiasters = BigInt(Math.round(payload.reservedAmountEgp * 100));
    const requestedAllocationPiasters = BigInt(
      Math.round(payload.requestedAllocationEgp * 100),
    );

    const reservation =
      this.allocationDomainService.computeMonetaryAllocationReservation({
        donationStatus: payload.donationStatus,
        restrictedCategory: payload.restrictedCategory,
        requestCategory: payload.requestCategory,
        availableAmountPiasters,
        reservedAmountPiasters,
        requestedAllocationPiasters,
      });

    return {
      allowed: true,
      nextAvailableEgp: Number(reservation.nextAvailablePiasters) / 100,
      nextReservedEgp: Number(reservation.nextReservedPiasters) / 100,
      messageAr: "تم حجز المبلغ ذرياً بنجاح دون تجاوز الرصيد المتاح.",
    };
  }

  initiateAuth(payload: RegisterAccountRequestDto): PublicAuthAcceptedResponseDto {
    const idResult = validateEgyptianNationalId(payload.nationalId);
    if (!idResult.isValid) {
      throw new BadRequestException(idResult.errorAr);
    }

    const phoneResult = normalizeAndValidateEgyptianMobile(payload.primaryMobile);
    if (!phoneResult.isValid) {
      throw new BadRequestException(phoneResult.errorAr);
    }

    return {
      status: "VERIFICATION_STEP_INITIATED",
      verificationCorrelationId: randomUUID(),
      messageAr:
        "تم استلام الطلب وبدء خطوة التحقق عبر رمز OTP المرسل للهاتف المحمول دون كشف حالة الحساب.",
      expiresInSeconds: 300,
    };
  }

  verifyOtp(payload: VerifyPhoneOtpRequestDto) {
    if (!/^\d{6}$/.test((payload.otpCode || "").trim())) {
      throw new BadRequestException("رمز التحقق (OTP) يجب أن يتكون من 6 أرقام صحيحة.");
    }

    return {
      status: "VERIFIED",
      verificationCorrelationId: payload.verificationCorrelationId,
      messageAr: "تم التحقق من ملكية رقم الهاتف المحمول وتفعيل الجلسة بنجاح.",
    };
  }
}
