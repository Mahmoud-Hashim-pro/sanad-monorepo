export interface MockTenant {
  id: string;
  type: "ASSOCIATION" | "INDIVIDUAL";
  nameAr: string;
  registrationNumber?: string;
  governorate: string;
  status: "ACTIVE" | "PENDING_APPROVAL";
  beneficiariesCount: number;
  activeCasesCount: number;
  confirmedDonationsEgp: number;
  reservedAllocationsEgp: number;
  availableBalanceEgp: number;
}

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
];

export const FICTIONAL_CASES = [
  {
    id: "case-101",
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0104",
    beneficiaryNameAr: "فاطمة عبد الرحمن السيد (بيانات خيالية)",
    maskedNationalId: "284061216****8",
    householdCode: "HH-GH-0089",
    targetType: "HOUSEHOLD",
    categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "RESERVED",
    deliveryStatus: "CONFIRMED",
    requestedEgp: 3500,
    approvedEgp: 3500,
    assignedVolunteerAr: "أحمد سامي الكيلاني",
    supervisorAr: "د. منى الشاذلي",
  },
  {
    id: "case-102",
    tenantId: "tenant-assn-noor-tanta",
    caseNumber: "CASE-2026-0119",
    beneficiaryNameAr: "محمود إبراهيم الدسوقي (بيانات خيالية)",
    maskedNationalId: "279110316****2",
    householdCode: "HH-GH-0112",
    targetType: "PERSON",
    categoryAr: "مساهمة في جراحة عيون عاجلة",
    caseStatus: "RESEARCH_SUBMITTED",
    researchStatus: "SUBMITTED",
    eligibilityDecision: "PENDING",
    allocationStatus: "UNALLOCATED",
    deliveryStatus: "PENDING",
    requestedEgp: 12000,
    approvedEgp: 0,
    assignedVolunteerAr: "سارة مجدي نصار",
    supervisorAr: "د. منى الشاذلي",
  },
  {
    id: "case-201",
    tenantId: "tenant-ind-tarek-mansoura",
    caseNumber: "IND-2026-0014",
    beneficiaryNameAr: "حسن عبد اللطيف الجندي (بيانات خيالية)",
    maskedNationalId: "281042212****5",
    householdCode: "HH-DK-0021",
    targetType: "PERSON",
    categoryAr: "أجهزة تعويضية وجلسات علاج طبيعي",
    caseStatus: "APPROVED",
    researchStatus: "REVIEWED",
    eligibilityDecision: "ELIGIBLE",
    allocationStatus: "RESERVED",
    deliveryStatus: "SCHEDULED",
    requestedEgp: 8500,
    approvedEgp: 8500,
    assignedVolunteerAr: "كريم عادل يونس",
    supervisorAr: "أ. طارق المنشاوي",
  },
];
