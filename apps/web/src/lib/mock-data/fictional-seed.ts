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
    id: "tenant-assn-noor-tanta",
    type: "ASSOCIATION",
    nameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    registrationNumber: "مشهـرة برقم 4182 لسنة 2018 - الغربية",
    governorate: "الغربية",
    status: "ACTIVE",
    beneficiariesCount: 342,
    activeCasesCount: 48,
    confirmedDonationsEgp: 425000,
    reservedAllocationsEgp: 115000,
    availableBalanceEgp: 190000,
  },
  {
    id: "tenant-ind-tarek-mansoura",
    type: "INDIVIDUAL",
    nameAr: "مبادرة أ. طارق المنشاوي لدعم الحالات الطبية العاجلة",
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
    registrationNumber: "مشهـرة برقم 5091 لسنة 2022 - الإسكندرية",
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
    id: "case-101",
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0104",
    beneficiaryNameAr: "فاطمة عبد الرحمن السيد (بيانات خيالية)",
    nationalId: "28406121601248",
    maskedNationalId: "284061216****8",
    phoneE164: "+201012345678",
    householdCode: "HH-GH-0089",
    governorate: "الغربية",
    targetType: "HOUSEHOLD",
    category: "MONTHLY_FOOD",
    categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "RESERVED",
    deliveryStatus: "CONFIRMED",
    requestedEgp: 3500,
    approvedEgp: 3500,
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    assignedVolunteerId: "user-vol-ahmed",
    supervisorAr: "د. منى الشاذلي",
    householdIncomeEgp: 2400,
    householdExpensesEgp: 5900,
    researchNotesAr:
      "تمت الزيارة الميدانية بقرية سبرباي بطنطا. الأسرة مكونة من أرملة و4 أبناء بمراحل التعليم الأساسي، ولا يوجد مصدر دخل ثابت سوى معاش تكافلي محدود.",
    reportVersion: 1,
  },
  {
    id: "case-102",
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0119",
    beneficiaryNameAr: "محمود إبراهيم الدسوقي (بيانات خيالية)",
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
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0125",
    beneficiaryNameAr: "آية كمال الشناوي (بيانات خيالية)",
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
    id: "case-104",
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0131",
    beneficiaryNameAr: "سعيد عبد الفتاح المرسي (بيانات خيالية)",
    nationalId: "28809251603114",
    maskedNationalId: "288092516****4",
    phoneE164: "+201551234567",
    householdCode: "HH-GH-0148",
    governorate: "الغربية",
    targetType: "HOUSEHOLD",
    category: "HOUSING_RENOVATION",
    categoryAr: "ترميم وتأهيل مسكن للأسر الأولى بالرعاية",
    caseStatus: "NEW",
    researchStatus: "NOT_ASSIGNED",
    eligibilityDecision: "PENDING",
    allocationStatus: "UNALLOCATED",
    deliveryStatus: "PENDING",
    requestedEgp: 15000,
    approvedEgp: 0,
    assignedVolunteerAr: "غير مسند بعد",
    assignedVolunteerId: "",
    supervisorAr: "د. منى الشاذلي",
    householdIncomeEgp: 2800,
    householdExpensesEgp: 5400,
    researchNotesAr: "طلب جديد بانتظار تكليف باحث ميداني لمعاينة سقف المنزل.",
    reportVersion: 0,
  },
  {
    id: "case-201",
    tenantId: "tenant-ind-tarek-mansoura",
    caseNumber: "IND-2026-0014",
    beneficiaryNameAr: "حسن عبد اللطيف الجندي (بيانات خيالية)",
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
    supervisorAr: "أ. طارق المنشاوي",
    householdIncomeEgp: 2900,
    householdExpensesEgp: 6200,
    researchNotesAr:
      "تمت المعاينة بمدينة المنصورة ومراجعة مقايسة الجهاز التعويضي من المركز الطبي المتخصص.",
    reportVersion: 1,
  },
  {
    id: "case-202",
    tenantId: "tenant-ind-tarek-mansoura",
    caseNumber: "IND-2026-0019",
    beneficiaryNameAr: "مريم فؤاد السلاب (بيانات خيالية)",
    nationalId: "29507141202871",
    maskedNationalId: "295071412****1",
    phoneE164: "+201065432198",
    householdCode: "HH-DK-0033",
    governorate: "الدقهلية",
    targetType: "PERSON",
    category: "MEDICAL_SURGERY",
    categoryAr: "مساهمة في جراحة طبية عاجلة",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "UNALLOCATED",
    deliveryStatus: "PENDING",
    requestedEgp: 9500,
    approvedEgp: 9500,
    assignedVolunteerAr: "كريم عادل يونس",
    assignedVolunteerId: "user-vol-karim",
    supervisorAr: "أ. طارق المنشاوي",
    householdIncomeEgp: 3100,
    householdExpensesEgp: 7400,
    researchNotesAr:
      "الحالة مستحقة لدعم تدخل جراحي عاجل بمستشفى الطوارئ بالمنصورة، وتم التحقق من الفواتير المبدئية.",
    reportVersion: 1,
  },
];

export const FICTIONAL_DONATIONS: MockDonation[] = [
  {
    id: "don-1001",
    tenantId: "tenant-assn-noor-tanta",
    receiptNumber: "RCP-2026-9001",
    donorNameAr: "الحاج عبد المنعم الشرقاوي (متبرع خيالي)",
    donationType: "MONETARY",
    status: "CONFIRMED",
    restrictedCategory: "UNRESTRICTED",
    restrictedCategoryAr: "غير مقيد (متاح لكافة مصارف الخير المعتمدة)",
    totalAmountEgp: 50000,
    reservedAmountEgp: 15000,
    deliveredAmountEgp: 10000,
    availableAmountEgp: 25000,
    createdAt: "2026-11-01",
  },
  {
    id: "don-1002",
    tenantId: "tenant-assn-noor-tanta",
    receiptNumber: "RCP-2026-9002",
    donorNameAr: "شركة الدلتا للصناعات الغذائية (تبرع مقيد)",
    donationType: "MONETARY",
    status: "CONFIRMED",
    restrictedCategory: "MONTHLY_FOOD",
    restrictedCategoryAr: "مقيد: إعانة شهرية وسلة غذائية للأسرة",
    totalAmountEgp: 30000,
    reservedAmountEgp: 3500,
    deliveredAmountEgp: 3500,
    availableAmountEgp: 23000,
    createdAt: "2026-11-03",
  },
  {
    id: "don-1003",
    tenantId: "tenant-assn-noor-tanta",
    receiptNumber: "RCP-2026-9003",
    donorNameAr: "د. سامح أبو اليزيد (صدقة جارية للتعليم)",
    donationType: "MONETARY",
    status: "PENDING_VERIFICATION",
    restrictedCategory: "EDUCATION_SUPPORT",
    restrictedCategoryAr: "مقيد: كفالة تعليمية ومصروفات دراسية",
    totalAmountEgp: 20000,
    reservedAmountEgp: 0,
    deliveredAmountEgp: 0,
    availableAmountEgp: 0,
    createdAt: "2026-11-07",
  },
  {
    id: "don-2001",
    tenantId: "tenant-ind-tarek-mansoura",
    receiptNumber: "IND-RCP-2026-041",
    donorNameAr: "م. خالد الجمل (مساهمة علاجية)",
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
  {
    id: "don-2002",
    tenantId: "tenant-ind-tarek-mansoura",
    receiptNumber: "IND-RCP-2026-045",
    donorNameAr: "فاعل خير - المنصورة",
    donationType: "MONETARY",
    status: "PENDING_VERIFICATION",
    restrictedCategory: "UNRESTRICTED",
    restrictedCategoryAr: "غير مقيد (متاح لكافة مصارف الخير المعتمدة)",
    totalAmountEgp: 15000,
    reservedAmountEgp: 0,
    deliveredAmountEgp: 0,
    availableAmountEgp: 0,
    createdAt: "2026-11-08",
  },
];

export const FICTIONAL_DELIVERIES: MockDelivery[] = [
  {
    id: "deliv-501",
    tenantId: "tenant-assn-noor-tanta",
    caseId: "case-101",
    caseNumber: "CASE-2026-0104",
    beneficiaryNameAr: "فاطمة عبد الرحمن السيد (بيانات خيالية)",
    descriptionAr: "صرف إعانة شهرية وسلة غذائية متكاملة لشهر نوفمبر",
    amountEgp: 3500,
    status: "CONFIRMED",
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    idempotencyKey: "IDEMP-DELIV-2026-101-A",
    scheduledAt: "2026-11-04",
    confirmedAt: "2026-11-05 14:20",
  },
  {
    id: "deliv-502",
    tenantId: "tenant-assn-noor-tanta",
    caseId: "case-103",
    caseNumber: "CASE-2026-0125",
    beneficiaryNameAr: "آية كمال الشناوي (بيانات خيالية)",
    descriptionAr: "تسليم شيك مصروفات دراسية وحقيبة مستلزمات تعليمية",
    amountEgp: 4500,
    status: "SCHEDULED",
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    idempotencyKey: "IDEMP-DELIV-2026-103-B",
    scheduledAt: "2026-11-09",
  },
  {
    id: "deliv-601",
    tenantId: "tenant-ind-tarek-mansoura",
    caseId: "case-201",
    caseNumber: "IND-2026-0014",
    beneficiaryNameAr: "حسن عبد اللطيف الجندي (بيانات خيالية)",
    descriptionAr: "تسليم جهاز تعويضي طبي ومستند جلسات العلاج الطبيعي",
    amountEgp: 8500,
    status: "SCHEDULED",
    assignedVolunteerAr: "كريم عادل يونس",
    idempotencyKey: "IDEMP-DELIV-2026-201-C",
    scheduledAt: "2026-11-10",
  },
];

export const FICTIONAL_SHARING_REQUESTS: MockSharingRequest[] = [
  {
    id: "share-301",
    requestingTenantNameAr: "مبادرة أ. طارق المنشاوي لدعم الحالات الطبية العاجلة",
    owningTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    beneficiaryNameAr: "محمود إبراهيم الدسوقي (بيانات خيالية)",
    maskedNationalId: "279110316****2",
    scopeAr: "الاطلاع على تقرير البحث الميداني والاحتياج الجراحي لمنع ازدواج الصرف والمساهمة المشتركة",
    status: "PENDING",
  },
  {
    id: "share-302",
    requestingTenantNameAr: "مؤسسة الرحمة للتنمية والتكافل بالإسكندرية",
    owningTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    beneficiaryNameAr: "فاطمة عبد الرحمن السيد (بيانات خيالية)",
    maskedNationalId: "284061216****8",
    scopeAr: "التحقق من حالة الاستحقاق السابقة عند انتقال الأسرة مؤقتاً",
    status: "APPROVED",
  },
];

export const FICTIONAL_AUDIT_LOGS: MockAuditLog[] = [
  {
    id: "audit-901",
    timestamp: "2026-11-08 09:15:00",
    actorNameAr: "د. منى الشاذلي",
    actorRoleAr: "مشرف البحث الاجتماعي",
    actionCode: "ELIGIBILITY_APPROVED",
    descriptionAr: "اعتماد أهلية الحالة CASE-2026-0104 بعد مراجعة التقرير الميداني (فصل المهام متحقق)",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
  },
  {
    id: "audit-902",
    timestamp: "2026-11-08 09:42:10",
    actorNameAr: "أ. عمرو عبد العزيز",
    actorRoleAr: "مدير جمعية خيرية",
    actionCode: "ALLOCATION_RESERVED_ATOMIC",
    descriptionAr: "تخصيص ذري لمبلغ 3,500 ج.م من الإيصال RCP-2026-9002 لصالح الحالة CASE-2026-0104",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
  },
  {
    id: "audit-903",
    timestamp: "2026-11-08 10:05:30",
    actorNameAr: "أحمد سامي الكيلاني",
    actorRoleAr: "باحث / متطوع ميداني",
    actionCode: "DELIVERY_CONFIRMED_IDEMPOTENT",
    descriptionAr: "تأكيد التسليم الفعلي للمساعدة للحالة CASE-2026-0104 بمفتاح عدم تكرار IDEMP-DELIV-2026-101-A",
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
      "استلام رسائل نصية على الهاتف المحمول الموثق (+201012345678) بمواعيد الزيارات الميدانية وإيصالات التسليم.",
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
