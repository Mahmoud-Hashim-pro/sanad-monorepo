import type { RoleCode } from "@sanad/shared";
import type { AidCategoryCode, MockCase, MockDonation } from "../mock-data/fictional-seed";

export interface DomainDecisionResult {
  allowed: boolean;
  reasonAr: string;
  ruleCode: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  messageAr: string;
  normalized?: string;
  strength?: "WEAK" | "MEDIUM" | "STRONG";
}

/**
 * Masks a 14-digit Egyptian National ID for privacy-preserving UI display.
 * Example: "28406121601248" -> "284061216****8"
 */
export function maskEgyptianNationalId(nationalId: string): string {
  const cleaned = nationalId.trim();
  if (cleaned.length !== 14) {
    return cleaned;
  }
  return `${cleaned.slice(0, 9)}****${cleaned.slice(13)}`;
}

/**
 * Validates full name (Arabic/Latin): must be at least 6 chars and contain at least two words (first & last name).
 */
export function validateFullName(rawName: string): FieldValidationResult {
  const cleaned = rawName.trim().replace(/\s+/g, " ");
  if (cleaned.length < 6) {
    return {
      isValid: false,
      messageAr: "الاسم الكامل يجب ألا يقل عن 6 أحرف.",
    };
  }
  const parts = cleaned.split(" ").filter((p) => p.length >= 2);
  if (parts.length < 2) {
    return {
      isValid: false,
      messageAr: "يرجى إدخال الاسم الثنائي أو الثلاثي على الأقل (الاسم الأول واسم العائلة).",
    };
  }
  if (!/^[\u0600-\u06FFa-zA-Z\s.\-']+$/.test(cleaned)) {
    return {
      isValid: false,
      messageAr: "الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية صحيحة فقط دون أرقام أو رموز غير صالحة.",
    };
  }
  return {
    isValid: true,
    normalized: cleaned,
    messageAr: `الاسم معتمد (${parts.length} مقاطع اسمية).`,
  };
}

/**
 * Validates Email Address with strict RFC-compatible pattern.
 */
export function validateEmailAddress(rawEmail: string): FieldValidationResult {
  const cleaned = rawEmail.trim().toLowerCase();
  if (!cleaned) {
    return {
      isValid: false,
      messageAr: "البريد الإلكتروني مطلوب للتوثيق واستلام الإشعارات الرسمية.",
    };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      messageAr: "صيغة البريد الإلكتروني غير صحيحة (مثال: name@charity.org.eg).",
    };
  }
  return {
    isValid: true,
    normalized: cleaned,
    messageAr: `صيغة البريد الإلكتروني صحيحة (${cleaned}).`,
  };
}

/**
 * Validates password strength (min 8 chars, checks mix of letters/numbers/symbols).
 */
export function validatePasswordStrength(rawPassword: string): FieldValidationResult {
  if (rawPassword.length < 8) {
    return {
      isValid: false,
      strength: "WEAK",
      messageAr: "كلمة المرور يجب أن تتكون من 8 خانات على الأقل.",
    };
  }
  const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(rawPassword);
  const hasDigits = /\d/.test(rawPassword);
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(rawPassword);

  if (hasLetters && hasDigits && hasSpecial && rawPassword.length >= 10) {
    return {
      isValid: true,
      strength: "STRONG",
      messageAr: "كلمة مرور قوية ومؤمّنة (تتضمن أحرفاً وأرقاماً ورموزاً).",
    };
  }
  if (hasLetters && hasDigits) {
    return {
      isValid: true,
      strength: "MEDIUM",
      messageAr: "كلمة مرور صالحة ومقبولة أمنياً.",
    };
  }
  return {
    isValid: false,
    strength: "WEAK",
    messageAr: "يجب أن تجمع كلمة المرور بين الأحرف والأرقام لضمان أمان الحساب.",
  };
}

/**
 * Validates 6-digit OTP verification code.
 */
export function validateOtpCode(rawOtp: string): FieldValidationResult {
  const cleaned = rawOtp.trim();
  if (!/^\d{6}$/.test(cleaned)) {
    return {
      isValid: false,
      messageAr: "رمز التحقق (OTP) يجب أن يتكون من 6 أرقام صحيحة.",
    };
  }
  return {
    isValid: true,
    normalized: cleaned,
    messageAr: "صيغة رمز التحقق (6 أرقام) مكتملة.",
  };
}

/**
 * Enforces Separation of Duties (SoD) for field research approval and eligibility decisions:
 * 1. Volunteers / field researchers can NEVER approve research reports or eligibility.
 * 2. The reviewer cannot be the same user who authored/submitted the field research report.
 */
export function canApproveResearchReport(params: {
  reviewerRole: RoleCode;
  reviewerUserId: string;
  authorUserId: string;
}): DomainDecisionResult {
  if (params.reviewerRole === "VOLUNTEER" || params.reviewerRole === "BENEFICIARY") {
    return {
      allowed: false,
      ruleCode: "SOD_ROLE_FORBIDDEN",
      reasonAr:
        "فصل المهام: لا يحق للمتطوع أو الباحث الميداني اعتماد نتائج البحث أو أهلية الحالة.",
    };
  }

  if (
    params.reviewerUserId &&
    params.authorUserId &&
    params.reviewerUserId.trim() === params.authorUserId.trim()
  ) {
    return {
      allowed: false,
      ruleCode: "SOD_SELF_APPROVAL_BLOCKED",
      reasonAr:
        "فصل المهام الرقابية (SoD): يُمنع اعتماد تقرير البحث الميداني بواسطة نفس الباحث الذي أعدّ التقرير؛ يجب المراجعة والاعتماد من مشرف مستقل.",
    };
  }

  return {
    allowed: true,
    ruleCode: "SOD_PASSED",
    reasonAr: "تحقق شرط فصل المهام الرقابية بنجاح.",
  };
}

/**
 * Validates an atomic financial allocation from a donation to a beneficiary case:
 * 1. Donation must be in CONFIRMED or PARTIALLY_ALLOCATED state.
 * 2. Case must be APPROVED / ELIGIBLE (or CONDITIONAL).
 * 3. If donation has a restricted category, it must match the case's category.
 * 4. Requested allocation amount must be > 0 and <= donation.availableAmountEgp.
 */
export function validateAllocationRequest(params: {
  donation: MockDonation;
  targetCase: MockCase;
  amountEgp: number;
}): DomainDecisionResult {
  const { donation, targetCase, amountEgp } = params;

  if (donation.tenantId !== targetCase.tenantId) {
    return {
      allowed: false,
      ruleCode: "TENANT_ISOLATION_VIOLATION",
      reasonAr: "عزل المستأجرين: لا يمكن تخصيص تبرع تابع لجهة خيرية لصالح حالة في جهة أخرى.",
    };
  }

  if (donation.status !== "CONFIRMED" && donation.status !== "PARTIALLY_ALLOCATED") {
    return {
      allowed: false,
      ruleCode: "DONATION_NOT_CONFIRMED",
      reasonAr:
        "لا يمكن التخصيص من تبرع غير مؤكد الاستلام (بانتظار التحقق المالي). يرجى تأكيد استلام التبرع أولاً.",
    };
  }

  if (
    targetCase.eligibilityDecision !== "ELIGIBLE" &&
    targetCase.eligibilityDecision !== "CONDITIONAL"
  ) {
    return {
      allowed: false,
      ruleCode: "CASE_NOT_ELIGIBLE",
      reasonAr:
        "لا يمكن تخصيص مبالغ مالية لحالة لم يتم اعتماد أهليتها من مشرف البحث الاجتماعي بعد.",
    };
  }

  if (
    donation.restrictedCategory !== "UNRESTRICTED" &&
    (donation.restrictedCategory as AidCategoryCode) !== targetCase.category
  ) {
    return {
      allowed: false,
      ruleCode: "RESTRICTED_CATEGORY_MISMATCH",
      reasonAr: `تعارض شرط المتبرع المقيد: هذا التبرع مخصص حصرياً لبند (${donation.restrictedCategoryAr}) بينما الحالة مصنفة تحت (${targetCase.categoryAr}).`,
    };
  }

  if (!Number.isFinite(amountEgp) || amountEgp <= 0) {
    return {
      allowed: false,
      ruleCode: "INVALID_AMOUNT",
      reasonAr: "مبلغ التخصيص يجب أن يكون قيمة مالية موجبة أكبر من الصفر.",
    };
  }

  if (amountEgp > donation.availableAmountEgp) {
    return {
      allowed: false,
      ruleCode: "INSUFFICIENT_DONATION_BALANCE",
      reasonAr: `الرصيد المتاح في هذا الإيصال (${donation.availableAmountEgp.toLocaleString("ar-EG")} ج.م) أقل من المبلغ المطلوب تخصيصه (${amountEgp.toLocaleString("ar-EG")} ج.م).`,
    };
  }

  return {
    allowed: true,
    ruleCode: "ALLOCATION_VALID",
    reasonAr: "التخصيص المالي الذري مطابق لشروط المتبرع والرصيد المتاح.",
  };
}
