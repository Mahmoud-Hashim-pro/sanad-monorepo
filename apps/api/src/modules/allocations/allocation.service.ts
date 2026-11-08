import { BadRequestException, ForbiddenException } from "@nestjs/common";

/**
 * Domain Service for Atomic Donation Allocations & Idempotent Aid Deliveries.
 * Monetary amounts are represented strictly in integer Piasters (قرش) to avoid floating-point errors.
 */
export class AllocationDomainService {
  /**
   * Validates that a volunteer cannot approve a research report or eligibility decision,
   * and an author cannot approve their own report.
   */
  validateIndependentResearchReview(params: {
    authorUserId: string;
    reviewerUserId: string;
    reviewerRole: string;
  }): void {
    if (params.reviewerRole === "VOLUNTEER") {
      throw new ForbiddenException("لا يحق للمتطوع أو الباحث الميداني اعتماد نتائج البحث أو أهلية الحالة.");
    }
    if (params.authorUserId === params.reviewerUserId) {
      throw new ForbiddenException("فصل المهام: لا يجوز لمعد التقرير الميداني اعتماد تقريره بنفسه.");
    }
  }

  /**
   * Reserves monetary funds from a CONFIRMED donation inside an atomic database transaction.
   */
  computeMonetaryAllocationReservation(params: {
    donationStatus: string;
    restrictedCategory?: string | null;
    requestCategory: string;
    availableAmountPiasters: bigint;
    reservedAmountPiasters: bigint;
    requestedAllocationPiasters: bigint;
  }): { nextAvailablePiasters: bigint; nextReservedPiasters: bigint } {
    if (params.donationStatus !== "CONFIRMED" && params.donationStatus !== "PARTIALLY_ALLOCATED") {
      throw new BadRequestException("لا يمكن التخصيص من تبرع غير مؤكد (Unconfirmed Donation).");
    }
    if (params.restrictedCategory && params.restrictedCategory !== params.requestCategory) {
      throw new BadRequestException("هذا التبرع مقيد لغرض محدد لا يطابق تصنيف طلب المساعدة.");
    }
    if (params.requestedAllocationPiasters <= 0n) {
      throw new BadRequestException("مبلغ التخصيص يجب أن يكون أكبر من الصفر.");
    }
    if (params.requestedAllocationPiasters > params.availableAmountPiasters) {
      throw new BadRequestException("الرصيد المتاح في التبرع لا يكفي لإتمام هذا التخصيص.");
    }

    return {
      nextAvailablePiasters: params.availableAmountPiasters - params.requestedAllocationPiasters,
      nextReservedPiasters: params.reservedAmountPiasters + params.requestedAllocationPiasters,
    };
  }
}
