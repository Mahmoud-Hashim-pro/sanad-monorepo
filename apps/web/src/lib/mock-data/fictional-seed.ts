export type TenantStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";

export type AidCategoryCode =
  | "MONTHLY_FOOD"
  | "MEDICAL_SURGERY"
  | "PROSTHETICS_REHAB"
  | "DEBT_RELIEF"
  | "EDUCATION_SUPPORT"
  | "HOUSING_RENOVATION";

export const AID_CATEGORIES_LABELS: Record<AidCategoryCode, string> = {
  MONTHLY_FOOD: "إعانة شهرية وسلة غذائية للأسرة",
  MEDICAL_SURGERY: "مساهمة في جراحة طبية عاجلة",
  PROSTHETICS_REHAB: "أجهزة تعويضية وجلسات علاج طبيعي",
  DEBT_RELIEF: "فك كرب وسداد ديون غارمين",
  EDUCATION_SUPPORT: "كفالة تعليمية ومصروفات دراسية",
  HOUSING_RENOVATION: "ترميم وتأهيل مسكن للأسر الأولى بالرعاية",
};

export interface MockTenant {
  id: string;
  type: "ASSOCIATION" | "INDIVIDUAL";
  nameAr: string;
  registrationNumber?: string;
  governorate: string;
  status: TenantStatus;
  beneficiariesCount: number;
  activeCasesCount: number;
  confirmedDonationsEgp: number;
  reservedAllocationsEgp: number;
  availableBalanceEgp: number;
}

export type CaseStatus =
  | "NEW"
  | "UNDER_RESEARCH"
  | "RESEARCH_SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type ResearchStatus =
  | "NOT_ASSIGNED"
  | "ASSIGNED"
  | "SUBMITTED"
  | "NEEDS_REVISION"
  | "REVIEWED";

export type EligibilityDecision =
  | "PENDING"
  | "ELIGIBLE"
  | "CONDITIONAL"
  | "INELIGIBLE";

export type AllocationStatus =
  | "UNALLOCATED"
  | "PARTIALLY_RESERVED"
  | "RESERVED"
  | "DISBURSED";

export type DeliveryStatus =
  | "PENDING"
  | "SCHEDULED"
  | "CONFIRMED";

export interface MockCase {
  id: string;
  tenantId: string;
  caseNumber: string;
  beneficiaryNameAr: string;
  nationalId: string;
  maskedNationalId: string;
  phoneE164: string;
  householdCode: string;
  governorate: string;
  targetType: "HOUSEHOLD" | "PERSON";
  category: AidCategoryCode;
  categoryAr: string;
  caseStatus: CaseStatus;
  researchStatus: ResearchStatus;
  eligibilityDecision: EligibilityDecision;
  allocationStatus: AllocationStatus;
  deliveryStatus: DeliveryStatus;
  requestedEgp: number;
  approvedEgp: number;
  assignedVolunteerAr: string;
  assignedVolunteerId: string;
  supervisorAr: string;
  householdIncomeEgp: number;
  householdExpensesEgp: number;
  researchNotesAr: string;
  reportVersion: number;
}

export interface MockDonation {
  id: string;
  tenantId: string;
  receiptNumber: string;
  donorNameAr: string;
  donationType: "MONETARY" | "IN_KIND";
  status: "CONFIRMED" | "PENDING_VERIFICATION" | "PARTIALLY_ALLOCATED" | "FULLY_ALLOCATED";
  restrictedCategory: AidCategoryCode | "UNRESTRICTED";
  restrictedCategoryAr: string;
  totalAmountEgp: number;
  reservedAmountEgp: number;
  deliveredAmountEgp: number;
  availableAmountEgp: number;
  createdAt: string;
}

export interface MockDelivery {
  id: string;
  tenantId: string;
  caseId: string;
  caseNumber: string;
  beneficiaryNameAr: string;
  descriptionAr: string;
  amountEgp: number;
  status: "SCHEDULED" | "CONFIRMED";
  assignedVolunteerAr: string;
  idempotencyKey: string;
  scheduledAt: string;
  confirmedAt?: string;
}

export interface MockSharingRequest {
  id: string;
  requestingTenantNameAr: string;
  owningTenantNameAr: string;
  beneficiaryNameAr: string;
  maskedNationalId: string;
  scopeAr: string;
  status: "PENDING" | "APPROVED" | "DENIED";
}

export interface MockAuditLog {
  id: string;
  timestamp: string;
  actorNameAr: string;
  actorRoleAr: string;
  actionCode: string;
  descriptionAr: string;
  tenantNameAr: string;
}

export interface MockConsentItem {
  id: string;
  titleAr: string;
  descriptionAr: string;
  scopeCode: string;
  granted: boolean;
  updatedAt: string;
}

export const FIELD_VOLUNTEERS = [
  { id: "user-vol-ahmed", nameAr: "أحمد سامي الكيلاني", governorate: "الغربية" },
  { id: "user-vol-sara", nameAr: "سارة مجدي نصار", governorate: "الغربية" },
  { id: "user-vol-karim", nameAr: "كريم عادل يونس", governorate: "الدقهلية" },
];

export const FICTIONAL_TENANTS: MockTenant[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    type: "ASSOCIATION",
    nameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    registrationNumber: "GHARBIA-ASSN-1842",
    governorate: "الغربية",
    status: "ACTIVE",
    beneficiariesCount: 342,
    activeCasesCount: 48,
    confirmedDonationsEgp: 425000,
    reservedAllocationsEgp: 115000,
    availableBalanceEgp: 190000,
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    type: "INDIVIDUAL",
    nameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري",
    governorate: "الدقهلية",
    status: "ACTIVE",
    beneficiariesCount: 64,
    activeCasesCount: 11,
    confirmedDonationsEgp: 98000,
    reservedAllocationsEgp: 28000,
    availableBalanceEgp: 45000,
  },
  {
    id: "tenant-assn-rahma-alex",
    type: "ASSOCIATION",
    nameAr: "مؤسسة الرحمة للتنمية والتكافل بالإسكندرية",
    registrationNumber: "ALEX-ASSN-5091",
    governorate: "الإسكندرية",
    status: "PENDING_APPROVAL",
    beneficiariesCount: 0,
    activeCasesCount: 0,
    confirmedDonationsEgp: 0,
    reservedAllocationsEgp: 0,
    availableBalanceEgp: 0,
  },
];

export const FICTIONAL_CASES: MockCase[] = [
  {
    id: "77777777-7777-4777-8777-777777777701",
    tenantId: "33333333-3333-4333-8333-333333333301",
    caseNumber: "CASE-2026-1042",
    beneficiaryNameAr: "فاطمة عبد الفتاح السيد",
    nationalId: "27905151601234",
    maskedNationalId: "279051516****4",
    phoneE164: "+201233344455",
    householdCode: "GH-HH-2026-001",
    governorate: "الغربية",
    targetType: "HOUSEHOLD",
    category: "MONTHLY_FOOD",
    categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "RESERVED",
    deliveryStatus: "CONFIRMED",
    requestedEgp: 2500,
    approvedEgp: 2500,
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    assignedVolunteerId: "user-vol-ahmed",
    supervisorAr: "د. منى الشاذلي",
    householdIncomeEgp: 1800,
    householdExpensesEgp: 4200,
    researchNotesAr:
      "تمت الزيارة الميدانية بقرية ميت حبيش البحرية بطنطا. الأسرة مكونة من أرملة وأبناء بمراحل التعليم الأساسي، وتحتاج دعم إعاشة وعلاج شهري.",
    reportVersion: 1,
  },
  {
    id: "case-102",
    tenantId: "33333333-3333-4333-8333-333333333301",
    caseNumber: "CASE-2026-0119",
    beneficiaryNameAr: "محمود إبراهيم الدسوقي",
    nationalId: "27911031602312",
    maskedNationalId: "279110316****2",
    phoneE164: "+201123456789",
    householdCode: "HH-GH-0112",
    governorate: "الغربية",
    targetType: "PERSON",
    category: "MEDICAL_SURGERY",
    categoryAr: "مساهمة في جراحة طبية عاجلة",
    caseStatus: "RESEARCH_SUBMITTED",
    researchStatus: "SUBMITTED",
    eligibilityDecision: "PENDING",
    allocationStatus: "UNALLOCATED",
    deliveryStatus: "PENDING",
    requestedEgp: 12000,
    approvedEgp: 0,
    assignedVolunteerAr: "سارة مجدي نصار",
    assignedVolunteerId: "user-vol-sara",
    supervisorAr: "د. منى الشاذلي",
    householdIncomeEgp: 3200,
    householdExpensesEgp: 6800,
    researchNotesAr:
      "تم الاطلاع على التقارير الطبية المعتمدة من مستشفى جامعة طنطا؛ الحالة تحتاج عملية إزالة مياه بيضاء وزرع عدسة بصورة عاجلة لرب الأسرة.",
    reportVersion: 1,
  },
  {
    id: "case-103",
    tenantId: "33333333-3333-4333-8333-333333333301",
    caseNumber: "CASE-2026-0125",
    beneficiaryNameAr: "آية كمال الشناوي",
    nationalId: "29203181604429",
    maskedNationalId: "292031816****9",
    phoneE164: "+201234567890",
    householdCode: "HH-GH-0134",
    governorate: "الغربية",
    targetType: "HOUSEHOLD",
    category: "EDUCATION_SUPPORT",
    categoryAr: "كفالة تعليمية ومصروفات دراسية",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "UNALLOCATED",
    deliveryStatus: "PENDING",
    requestedEgp: 4500,
    approvedEgp: 4500,
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    assignedVolunteerId: "user-vol-ahmed",
    supervisorAr: "د. منى الشاذلي",
    householdIncomeEgp: 3000,
    householdExpensesEgp: 6100,
    researchNotesAr:
      "تم التحقق من قيد الأبناء الثلاثة بالمدارس الحكومية واحتياجهم لمصروفات الكتب والزي المدرسي.",
    reportVersion: 2,
  },
  {
    id: "case-201",
    tenantId: "33333333-3333-4333-8333-333333333302",
    caseNumber: "IND-2026-0014",
    beneficiaryNameAr: "حسن عبد اللطيف الجندي",
    nationalId: "28104221201535",
    maskedNationalId: "281042212****5",
    phoneE164: "+201098765432",
    householdCode: "HH-DK-0021",
    governorate: "الدقهلية",
    targetType: "PERSON",
    category: "PROSTHETICS_REHAB",
    categoryAr: "أجهزة تعويضية وجلسات علاج طبيعي",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "RESERVED",
    deliveryStatus: "SCHEDULED",
    requestedEgp: 8500,
    approvedEgp: 8500,
    assignedVolunteerAr: "كريم عادل يونس",
    assignedVolunteerId: "user-vol-karim",
    supervisorAr: "سارة عبد الرحمن المنصوري",
    householdIncomeEgp: 2900,
    householdExpensesEgp: 6200,
    researchNotesAr:
      "تمت المعاينة بمدينة المنصورة ومراجعة مقايسة الجهاز التعويضي من المركز الطبي المتخصص.",
    reportVersion: 1,
  },
];

export const FICTIONAL_DONATIONS: MockDonation[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
    tenantId: "33333333-3333-4333-8333-333333333301",
    receiptNumber: "DON-2026-9001",
    donorNameAr: "المهندس طارق عبد العزيز",
    donationType: "MONETARY",
    status: "PARTIALLY_ALLOCATED",
    restrictedCategory: "UNRESTRICTED",
    restrictedCategoryAr: "غير مقيد (متاح لكافة مصارف الخير المعتمدة)",
    totalAmountEgp: 10000,
    reservedAmountEgp: 0,
    deliveredAmountEgp: 2500,
    availableAmountEgp: 7500,
    createdAt: "2026-02-01",
  },
  {
    id: "don-1002",
    tenantId: "33333333-3333-4333-8333-333333333301",
    receiptNumber: "RCP-2026-9002",
    donorNameAr: "شركة الدلتا للصناعات الغذائية",
    donationType: "MONETARY",
    status: "CONFIRMED",
    restrictedCategory: "MONTHLY_FOOD",
    restrictedCategoryAr: "مقيد: إعانة شهرية وسلة غذائية للأسرة",
    totalAmountEgp: 30000,
    reservedAmountEgp: 2500,
    deliveredAmountEgp: 2500,
    availableAmountEgp: 25000,
    createdAt: "2026-11-03",
  },
  {
    id: "don-2001",
    tenantId: "33333333-3333-4333-8333-333333333302",
    receiptNumber: "IND-RCP-2026-041",
    donorNameAr: "م. خالد الجمل",
    donationType: "MONETARY",
    status: "CONFIRMED",
    restrictedCategory: "MEDICAL_SURGERY",
    restrictedCategoryAr: "مقيد: مساهمة في جراحة طبية عاجلة",
    totalAmountEgp: 25000,
    reservedAmountEgp: 0,
    deliveredAmountEgp: 5000,
    availableAmountEgp: 20000,
    createdAt: "2026-11-04",
  },
];

export const FICTIONAL_DELIVERIES: MockDelivery[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccc01",
    tenantId: "33333333-3333-4333-8333-333333333301",
    caseId: "77777777-7777-4777-8777-777777777701",
    caseNumber: "CASE-2026-1042",
    beneficiaryNameAr: "فاطمة عبد الفتاح السيد",
    descriptionAr: "صرف مساعدة علاجية معتمدة للأسرة بقيمة 2,500 ج.م",
    amountEgp: 2500,
    status: "CONFIRMED",
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    idempotencyKey: "seed-delivery-idem-2026-0001",
    scheduledAt: "2026-02-04",
    confirmedAt: "2026-02-05 14:30",
  },
  {
    id: "deliv-502",
    tenantId: "33333333-3333-4333-8333-333333333301",
    caseId: "case-103",
    caseNumber: "CASE-2026-0125",
    beneficiaryNameAr: "آية كمال الشناوي",
    descriptionAr: "تسليم شيك مصروفات دراسية وحقيبة مستلزمات تعليمية",
    amountEgp: 4500,
    status: "SCHEDULED",
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    idempotencyKey: "IDEMP-DELIV-2026-103-B",
    scheduledAt: "2026-11-09",
  },
];

export const FICTIONAL_SHARING_REQUESTS: MockSharingRequest[] = [
  {
    id: "share-301",
    requestingTenantNameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري",
    owningTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    beneficiaryNameAr: "محمود إبراهيم الدسوقي",
    maskedNationalId: "279110316****2",
    scopeAr: "الاطلاع على تقرير البحث الميداني والاحتياج الجراحي لمنع ازدواج الصرف والمساهمة المشتركة",
    status: "PENDING",
  },
  {
    id: "share-302",
    requestingTenantNameAr: "مؤسسة الرحمة للتنمية والتكافل بالإسكندرية",
    owningTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    beneficiaryNameAr: "فاطمة عبد الفتاح السيد",
    maskedNationalId: "279051516****4",
    scopeAr: "التحقق من حالة الاستحقاق السابقة عند انتقال الأسرة مؤقتاً",
    status: "APPROVED",
  },
];

export const FICTIONAL_AUDIT_LOGS: MockAuditLog[] = [
  {
    id: "99999999-9999-4999-8999-999999999900",
    timestamp: "2026-11-08 09:00:00",
    actorNameAr: "م. محمود هاشم (eng.mhashim@gmail.com)",
    actorRoleAr: "مدير المنصة المركزي (SUPER_ADMIN)",
    actionCode: "SUPER_ADMIN_ACCOUNT_PROVISIONED",
    descriptionAr: "توثيق وتفعيل حساب مدير المنصة المركزي في قاعدة بيانات Neon PostgreSQL",
    tenantNameAr: "الإدارة المركزية لمنصة سَنَد",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddd01",
    timestamp: "2026-11-08 10:05:30",
    actorNameAr: "أحمد محمود الشناوي",
    actorRoleAr: "مدير جمعية خيرية",
    actionCode: "DELIVERY_CONFIRMED",
    descriptionAr: "تأكيد التسليم الفعلي للمساعدة للحالة CASE-2026-1042 بمفتاح عدم تكرار seed-delivery-idem-2026-0001",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
  },
];

export const FICTIONAL_CONSENTS: MockConsentItem[] = [
  {
    id: "consent-1",
    titleAr: "مشاركة ملخص الحالة الاجتماعية مع المبادرات الطبية الشريكة",
    descriptionAr:
      "السماح للجهات الخيرية المعتمدة على منصة سَنَد بالاطلاع على قرار الأهلية فقط عند طلب مساهمة علاجية مشتركة دون كشف الرقم القومي الكامل.",
    scopeCode: "SHARE_ELIGIBILITY_SUMMARY",
    granted: true,
    updatedAt: "2026-11-02",
  },
  {
    id: "consent-2",
    titleAr: "إشعارات الرسائل القصيرة (SMS) عند جدولة تسليم المساعدات",
    descriptionAr:
      "استلام رسائل نصية على الهاتف المحمول الموثق بمواعيد الزيارات الميدانية وإيصالات التسليم.",
    scopeCode: "SMS_DELIVERY_NOTIFICATIONS",
    granted: true,
    updatedAt: "2026-11-02",
  },
  {
    id: "consent-3",
    titleAr: "مشاركة المستندات الطبية المرفقة مع الصناديق العلاجية المتخصصة",
    descriptionAr:
      "إتاحة التقارير الطبية المرفقة للجان الطبية في الجمعيات الشريكة لتسريع اعتماد العمليات الجراحية.",
    scopeCode: "SHARE_MEDICAL_ATTACHMENTS",
    granted: false,
    updatedAt: "2026-11-05",
  },
];

export const FICTIONAL_CONSENSTS = FICTIONAL_CONSENTS;
