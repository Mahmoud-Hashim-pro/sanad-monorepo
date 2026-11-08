import type { RoleCode } from "@sanad/shared";
import type { AidCategoryCode, MockCase, MockDonation } from "../mock-data/fictional-seed";

export interface DomainDecisionResult {
  allowed: boolean;
  reasonAr: string;
  ruleCode: string;
}

export type AuthRoleCode =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY";

export const ROLE_LABELS_AR: Record<AuthRoleCode, string> = {
  SUPER_ADMIN: "مدير المنصة المركزي (SUPER_ADMIN)",
  ASSOCIATION_ADMIN: "مدير جمعية خيرية مشهرة (ASSOCIATION_ADMIN)",
  INDIVIDUAL_INITIATIVE: "مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)",
  RESEARCH_SUPERVISOR: "مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)",
  VOLUNTEER: "باحث / متطوع ميداني (VOLUNTEER)",
  BENEFICIARY: "مستفيد / طالب مساعدة (BENEFICIARY)",
};

export const ROLE_PERMISSIONS_MAP: Record<AuthRoleCode, string[]> = {
  SUPER_ADMIN: [
    "platform:tenants:approve",
    "platform:users:manage",
    "platform:reference_data:manage",
    "platform:audit:read",
    "platform:stats:read",
    "tenant:members:manage",
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  ASSOCIATION_ADMIN: [
    "tenant:members:manage",
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  INDIVIDUAL_INITIATIVE: [
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  RESEARCH_SUPERVISOR: [
    "tenant:cases:read_assigned",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:cases:recommend_eligibility",
  ],
  VOLUNTEER: [
    "tenant:tasks:read_assigned",
    "tenant:research:submit_report",
    "tenant:attachments:upload_authorized",
    "tenant:deliveries:confirm_assigned",
  ],
  BENEFICIARY: [
    "portal:profile:manage_own",
    "portal:requests:create_own",
    "portal:requests:read_own",
    "portal:documents:upload_own",
    "portal:aid_history:read_own_verified",
    "portal:corrections:submit_own",
  ],
};

export const PERMISSION_DESCRIPTIONS_AR: Record<string, string> = {
  // Platform Super Admin
  "platform:tenants:approve": "مراجعة واعتماد الجمعيات الخيرية والمبادرات الأهلية وإصدار تراخيص العمل",
  "platform:users:manage": "إدارة حسابات المستخدمين وتعيين الأدوار وتعديل الصلاحيات واعتماد كلمات المرور",
  "platform:reference_data:manage": "إدارة الجداول المرجعية ومحددات السياسات والحوكمة والرقمنة",
  "platform:audit:read": "الاطلاع على سجلات التدقيق الجنائي غير القابلة للتعديل وتتبع العمليات",
  "platform:stats:read": "متابعة المؤشرات الإحصائية العامة ونسب الصرف ومؤشرات الأداء الوطنية",
  // Tenant & Case Management
  "tenant:members:manage": "إدارة أعضاء فريق العمل والمتطوعين داخل نطاق الكيان",
  "tenant:beneficiaries:manage": "تسجيل وتعديل بيانات المستفيدين وفحص الأهلية بالرقم القومي المصري",
  "tenant:households:manage": "إدارة ملفات الأسر والتكوين الأسري والظروف المعيشية والسكنية",
  "tenant:cases:manage": "إنشاء ومتابعة الحالات المعزولة ومسارات المساعدة الخمسة",
  "tenant:cases:decide_eligibility": "اعتماد قرار الأهلية النهائي وصرف الإعانات المعتمدة",
  "tenant:cases:recommend_eligibility": "التوصية بقرار الأهلية ورفع تقرير الاستحقاق والاعتماد للمدير",
  "tenant:cases:read_assigned": "الاطلاع على الحالات المسندة للبحث الميداني أو المراجعة الرقابية",
  "tenant:research:assign": "إسناد الزيارات الميدانية والأبحاث للباحثين والمتطوعين",
  "tenant:research:review": "مراجعة واعتماد التقارير الميدانية مع تطبيق قواعد فصل المهام الرقابية SoD",
  "tenant:research:submit_report": "إجراء الزيارة الميدانية ورفع تقرير الاستحقاق والبيئة المعيشية والدخل",
  "tenant:attachments:upload_authorized": "رفع المستندات وصور المنزل وبطاقات الهوية المعتمدة",
  "tenant:donors:manage": "تسجيل بيانات المتبرعين وقنوات الدعم المالي والعيني",
  "tenant:donations:manage": "إدارة التبرعات وربطها بالمصارف المحددة وتأكيد التحصيل المالي",
  "tenant:allocations:create": "إجراء الحجز المالي الذري للمساعدات لمنع ازدواج الصرف",
  "tenant:deliveries:manage": "جدولة وإدارة عمليات تسليم المساعدات للمستحقين",
  "tenant:deliveries:confirm_assigned": "التأكيد الميداني لتسليم المساعدة وتوثيق الاستلام بالرقم القومي",
  "tenant:reports:read": "استخراج تقارير الأداء والميزانيات وسجلات الحالات",
  "tenant:tasks:read_assigned": "عرض قائمة المهام والزيارات الميدانية المسندة",
  // Beneficiary Portal
  "portal:profile:manage_own": "عرض وتحديث الملف الشخصي للمستفيد وإدارة موافقة مشاركة البيانات",
  "portal:requests:create_own": "تقديم طلب مساعدة جديد إلكترونياً بالرقم القومي",
  "portal:requests:read_own": "متابعة حالة طلبات المساعدة ومراحل البحث الميداني والتسليم",
  "portal:documents:upload_own": "رفع المستندات الثبوتية والمؤيدة للطلب",
  "portal:aid_history:read_own_verified": "الاطلاع على سجل المساعدات المستلمة والمجدولة الموثقة",
  "portal:corrections:submit_own": "تقديم طلب تصحيح بيانات أو تظلم إلكتروني",
};

export interface RoleGuideItem {
  code: AuthRoleCode;
  titleAr: string;
  badgeClass: string;
  summaryAr: string;
  responsibilitiesAr: string[];
  permissionsCount: number;
}

export const ROLE_GUIDE_ITEMS_AR: RoleGuideItem[] = [
  {
    code: "SUPER_ADMIN",
    titleAr: "مدير المنصة المركزي (SUPER_ADMIN)",
    badgeClass: "bg-purple-150 text-purple-900 border-purple-300",
    summaryAr: "أعلى سلطة رقابية وحوكمة على المنصة، يدير اعتماد الكيانات وتعيين الأدوار لكافة المستخدمين.",
    responsibilitiesAr: [
      "اعتماد وتفعيل الجمعيات الخيرية والمبادرات الأهلية",
      "إضافة وتعديل حسابات المستخدمين وتعيين الأدوار وكلمات المرور",
      "متابعة سجلات التدقيق الجنائي غير القابلة للتلاعب وتتبع الأحداث",
      "إدارة مطابقة الرقم القومي ومنع تكرار صرف المساعدات على مستوى الجمهورية",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.SUPER_ADMIN.length,
  },
  {
    code: "ASSOCIATION_ADMIN",
    titleAr: "مدير جمعية خيرية مشهرة (ASSOCIATION_ADMIN)",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    summaryAr: "الإدارة الكاملة لأنشطة الجمعية وحالاتها المعزولة وميزانيات التبرعات وعمليات الصرف.",
    responsibilitiesAr: [
      "إدارة الحالات المعزولة بنطاق حماية المستأجرين (Row-Level Tenant Isolation)",
      "تسجيل التبرعات المقيدة وغير المقيدة وتأكيد التحصيل",
      "إجراء الحجز المالي الذري للحالات المعتمدة لمنع عجز الموازنة",
      "طلب مشاركة بيانات الحالات المشتركة مع الجمعيات الأخرى",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.ASSOCIATION_ADMIN.length,
  },
  {
    code: "INDIVIDUAL_INITIATIVE",
    titleAr: "مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    summaryAr: "إدارة المبادرات التطوعية الفردية المستقلة بنفس معايير الشفافية والحوكمة المصرفية.",
    responsibilitiesAr: [
      "إدارة نطاق حالات المبادرة الميدانية والتبرعات المجمعة",
      "إسناد وتنسيق زيارات المتطوعين الميدانية للأسر المستحقة",
      "تأكيد تسليم المساعدات وتوثيق الاستلام بالرقم القومي",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.INDIVIDUAL_INITIATIVE.length,
  },
  {
    code: "RESEARCH_SUPERVISOR",
    titleAr: "مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    summaryAr: "جهة رقابية مستقلة تختص بمراجعة الأبحاث الميدانية واعتماد قرار الأهلية مع منع التعدي الرقابي (SoD).",
    responsibilitiesAr: [
      "إسناد طلبات المساعدة الميدانية للباحثين والمتطوعين",
      "مراجعة تقارير البحث الاجتماعي وتقدير فجوة الاحتياج المالي",
      "اعتماد قرار الاستحقاق أو طلب إعادة البحث الميداني",
      "تطبيق قاعدة SoD: حظر اعتماد تقرير باحث قام المشرف بكتابته بنفسه",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.RESEARCH_SUPERVISOR.length,
  },
  {
    code: "VOLUNTEER",
    titleAr: "باحث / متطوع ميداني (VOLUNTEER)",
    badgeClass: "bg-teal-100 text-teal-900 border-teal-300",
    summaryAr: "الذراع الميداني للمنصة لإجراء المعاينات الواقعية وحصر الدخل والمصروفات والتسليم.",
    responsibilitiesAr: [
      "إجراء الزيارات الميدانية لمنازل المستفيدين ومعاينة المسكن",
      "حصر دخل الأسرة ومصروفاتها الحتمية والديون المتراكمة",
      "رفع التقرير الميداني والتوصيات الأولية للمشرف",
      "التأكيد الميداني لتسليم المساعدات العينية والنقدية للمستحقين",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.VOLUNTEER.length,
  },
  {
    code: "BENEFICIARY",
    titleAr: "مستفيد / طالب مساعدة (BENEFICIARY)",
    badgeClass: "bg-rose-100 text-rose-900 border-rose-300",
    summaryAr: "بوابة المواطن المستحق للتسجيل ومتابعة الطلبات وحوكمة بياناته الشخصية.",
    responsibilitiesAr: [
      "الاطلاع على الملف الشخصي الموحد وبيانات الأسرة",
      "تقديم طلب مساعدة إلكتروني بالرقم القومي",
      "متابعة مسار الطلب من البحث الميداني وحتى التسليم",
      "إدارة موافقة مشاركة البيانات (Consent Management) لحماية الخصوصية",
    ],
    permissionsCount: ROLE_PERMISSIONS_MAP.BENEFICIARY.length,
  },
];

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
