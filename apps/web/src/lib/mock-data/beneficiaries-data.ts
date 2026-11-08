export interface BeneficiaryDependent {
  id: string;
  fullNameAr: string;
  relationshipAr: string; // زوج، زوجة، ابن، ابنة، والد، والدة، أخ
  age: number;
  educationStageAr: string; // بدون تعليم / أمي، ابتدائي، إعدادي، ثانوي/دبلوم، جامعي
  educationExpensesEgp?: number;
  healthStatusAr: string; // سليم، مرض مزمن، إعاقة حركية، إعاقة ذهنية
  hasDisabilityCard: boolean; // بطاقة إثبات الإعاقة والخدمات المتكاملة
  occupationAr: string; // طالب، بدون عمل، عمالة غير منتظمة / يومية، ربة منزل
}

export interface HousingDetails {
  governorate: string;
  cityOrCenterAr: string;
  districtOrVillageAr: string;
  streetAddressAr: string;
  landmarkAr: string; // نقطة دالة بارزة
  tenureTypeAr: string; // إيجار جديد، إيجار قديم، سكن عائلي / مشترك، ملك متهالك، عشة / سكن غير ملائم
  monthlyRentEgp?: number;
  roofTypeAr: string; // خرسانة مسلحة، خشب وعروق وجريد متهالك، صاج وألواح، بدون سقف
  wallConditionAr: string; // طوب أحمر، محارة ودهان، طين نيئ، متصدع
  floorTypeAr: string; // بلاط/سيراميك، خرسانة عادية، تراب وحصى
  hasDrinkingWater: boolean; // مياه شرب نظيفة متصلة
  hasElectricityMeter: boolean; // عداد كهرباء مستقل أو ممارسة
  hasSanitationSystem: boolean; // شبكة صرف صحي نظامية أو خزان تقليدي
  photoUrls: string[]; // صور واجهة المنزل، السقف، الغرف، المرافق
}

export interface FinancialProfile {
  monthlyIncomeEgp: number;
  incomeSourcesAr: string[]; // عمالة يومية غير منتظمة، معاش تكافل وكرامة، مساعدات أهل الخير
  takafulAndKaramaAmountEgp?: number;
  monthlyExpensesEgp: number;
  expenseBreakdownAr: { itemAr: string; amountEgp: number }[]; // إيجار، علاج شهري، طعام ومدارس
  isIndebtedGharim: boolean; // هل غارم / غارمة؟
  debtsTotalEgp?: number;
  debtsNotesAr?: string; // تفاصيل إيصالات الأمانة أو ديون العلاج
  monthlyDeficitEgp: number; // العجز الشهري المحسوب (المصروفات - الدخل)
}

export interface ResearchContactInfo {
  volunteerNameAr: string;
  volunteerPhone: string;
  visitDate: string;
  supervisorNameAr: string;
  supervisorPhone: string;
  approvalDate: string;
  decisionAr: "مستحق كلياً (أولوية قصوى)" | "مستحق جزئياً" | "مستحق مشروط" | "غير مستحق";
  priorityLevel: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  fieldNotesAr: string;
  recommendationsAr?: string;
}

export interface PastAidRecord {
  id: string;
  date: string;
  categoryAr: string;
  descriptionAr: string;
  amountOrQuantityAr: string;
  donorTenantNameAr: string;
  disbursingOfficerNameAr: string;
  disbursingOfficerPhone: string; // هاتف مسؤول الصرف للتواصل المباشر والاستفسار
  receiptNumber?: string;
}

export interface Beneficiary360Profile {
  id: string;
  nationalId: string;
  maskedNationalId: string;
  fullNameAr: string;
  age: number;
  genderAr: "ذكر" | "أنثى";
  maritalStatusAr: string; // متزوج ويعول، أرملة تعول، مطلقة تعول، مهجورة، مسن بمفرده، أعزب
  primaryPhone: string;
  alternativePhone?: string;
  email?: string;
  housing: HousingDetails;
  dependents: BeneficiaryDependent[];
  financial: FinancialProfile;
  researchContact: ResearchContactInfo;
  pastAids: PastAidRecord[];
  activeCaseNumber?: string;
  tenantId?: string;
  tenantNameAr?: string;
  isDataSharingApproved?: boolean;
}

// Clean Slate: Initial beneficiary profiles list is completely empty for production
export const INITIAL_BENEFICIARIES_PROFILES: Beneficiary360Profile[] = [];

/**
 * Helper to match or dynamically construct a Beneficiary 360 profile
 * for any search query (National ID, Phone, Name, Email).
 */
export function findOrCreateBeneficiaryProfile(
  query: {
    nationalId?: string;
    phone?: string;
    name?: string;
    email?: string;
  },
  existingProfiles: Beneficiary360Profile[] = []
): Beneficiary360Profile | null {
  const norm = (s?: string) => (s || "").replace(/[^0-9a-zA-Z\u0600-\u06FF]/g, "").toLowerCase();

  const qNat = norm(query.nationalId);
  const qPhone = norm(query.phone);
  const qName = norm(query.name);
  const qEmail = norm(query.email);

  // 1. Direct match in existing profiles
  for (const p of existingProfiles) {
    if (qNat && (norm(p.nationalId).includes(qNat) || qNat.includes(norm(p.nationalId)))) {
      return p;
    }
    if (qPhone && (norm(p.primaryPhone).includes(qPhone) || (p.alternativePhone && norm(p.alternativePhone).includes(qPhone)))) {
      return p;
    }
    if (qEmail && p.email && norm(p.email) === qEmail) {
      return p;
    }
    if (qName && (norm(p.fullNameAr).includes(qName) || qName.includes(norm(p.fullNameAr)))) {
      return p;
    }
  }

  // 2. If query specifies at least a name or nationalId or phone, synthesize a clean blank profile ready for entry
  if (qName || qNat || qPhone || qEmail) {
    const rawNat = query.nationalId || "29501010101234";
    const maskedNat = rawNat.length >= 14 ? `${rawNat.slice(0, 9)}****${rawNat.slice(13)}` : "295010101****4";
    const name = query.name || "مستفيد جديد قيد التسجيل";
    const phone = query.phone || "+201000000000";

    return {
      id: `ben-${Date.now()}`,
      nationalId: rawNat,
      maskedNationalId: maskedNat,
      fullNameAr: name,
      age: 35,
      genderAr: "ذكر",
      maritalStatusAr: "متزوج ويعول",
      primaryPhone: phone,
      email: query.email,
      housing: {
        governorate: "القاهرة",
        cityOrCenterAr: "العاصمة",
        districtOrVillageAr: "محل الإقامة",
        streetAddressAr: "العنوان قيد التوثيق الميداني",
        landmarkAr: "علامة مميزة",
        tenureTypeAr: "إيجار جديد",
        monthlyRentEgp: 0,
        roofTypeAr: "خرسانة مسلحة",
        wallConditionAr: "طوب أحمر",
        floorTypeAr: "بلاط",
        hasDrinkingWater: true,
        hasElectricityMeter: true,
        hasSanitationSystem: true,
        photoUrls: [],
      },
      dependents: [],
      financial: {
        monthlyIncomeEgp: 0,
        incomeSourcesAr: ["قيد التحديد الميداني"],
        monthlyExpensesEgp: 0,
        expenseBreakdownAr: [],
        isIndebtedGharim: false,
        monthlyDeficitEgp: 0,
      },
      researchContact: {
        volunteerNameAr: "لم يعين بعد",
        volunteerPhone: "+201000000000",
        visitDate: new Date().toISOString().slice(0, 10),
        supervisorNameAr: "مشرف البحث",
        supervisorPhone: "+201000000000",
        approvalDate: "قيد المراجعة",
        decisionAr: "مستحق جزئياً",
        priorityLevel: "MEDIUM",
        fieldNotesAr: "ملف جديد تم إنشاؤه وبانتظار الزيارة الميدانية للباحث.",
      },
      pastAids: [],
    };
  }

  return null;
}
