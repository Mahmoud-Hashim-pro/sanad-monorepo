export interface IndependentResearchReviewParams {
  authorUserId: string;
  reviewerUserId: string;
  reviewerRole: string;
}

export interface IndependentResearchReviewResult {
  allowed: boolean;
  errorAr?: string;
}

/**
 * Pure domain rule enforcing Separation of Duties (SoD) for field research review:
 * 1. Volunteers cannot approve research reports or eligibility decisions.
 * 2. Only RESEARCH_SUPERVISOR or TENANT_ADMIN can review/approve research reports.
 * 3. A report author cannot review or approve their own field report.
 */
export function validateIndependentResearchReview(
  params: IndependentResearchReviewParams,
): IndependentResearchReviewResult {
  if (params.reviewerRole === "VOLUNTEER") {
    return {
      allowed: false,
      errorAr: "لا يحق للمتطوع أو الباحث الميداني اعتماد نتائج البحث أو أهلية الحالة.",
    };
  }

  if (
    params.reviewerRole !== "RESEARCH_SUPERVISOR" &&
    params.reviewerRole !== "TENANT_ADMIN"
  ) {
    return {
      allowed: false,
      errorAr: "اعتماد البحث الاجتماعي يقتصر على مشرف البحث أو مدير الجهة فقط.",
    };
  }

  if (params.authorUserId.trim() === params.reviewerUserId.trim()) {
    return {
      allowed: false,
      errorAr: "فصل المهام: لا يجوز لمعد التقرير الميداني اعتماد تقريره بنفسه.",
    };
  }

  return { allowed: true };
}

export interface MonetaryAllocationParams {
  donationStatus: string;
  restrictedCategory?: string | null;
  requestCategory: string;
  availableAmountEgp: number;
  reservedAmountEgp: number;
  requestedAllocationEgp: number;
}

export interface MonetaryAllocationResult {
  allowed: boolean;
  errorAr?: string;
  nextAvailableEgp?: number;
  nextReservedEgp?: number;
}

/**
 * Pure domain rule for monetary donation allocation reservations:
 * - Only CONFIRMED or PARTIALLY_ALLOCATED donations can be allocated.
 * - Restricted donations must match the assistance request category.
 * - Requested allocation must be > 0 and <= available amount (preventing over-allocation).
 * - Uses integer piasters internally to avoid IEEE-754 floating-point drift.
 */
export function computeMonetaryAllocation(
  params: MonetaryAllocationParams,
): MonetaryAllocationResult {
  if (
    params.donationStatus !== "CONFIRMED" &&
    params.donationStatus !== "PARTIALLY_ALLOCATED"
  ) {
    return {
      allowed: false,
      errorAr: "لا يمكن التخصيص من تبرع غير مؤكد (Unconfirmed Donation).",
    };
  }

  if (
    params.restrictedCategory &&
    params.restrictedCategory !== params.requestCategory
  ) {
    return {
      allowed: false,
      errorAr: "هذا التبرع مقيد لغرض محدد لا يطابق تصنيف طلب المساعدة.",
    };
  }

  const availablePiasters = Math.round(params.availableAmountEgp * 100);
  const reservedPiasters = Math.round(params.reservedAmountEgp * 100);
  const requestedPiasters = Math.round(params.requestedAllocationEgp * 100);

  if (requestedPiasters <= 0) {
    return {
      allowed: false,
      errorAr: "مبلغ التخصيص يجب أن يكون أكبر من الصفر.",
    };
  }

  if (requestedPiasters > availablePiasters) {
    return {
      allowed: false,
      errorAr: "الرصيد المتاح في التبرع لا يكفي لإتمام هذا التخصيص.",
    };
  }

  return {
    allowed: true,
    nextAvailableEgp: (availablePiasters - requestedPiasters) / 100,
    nextReservedEgp: (reservedPiasters + requestedPiasters) / 100,
  };
}
