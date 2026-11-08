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

// Clean Slate: Fictional/Seed data emptied completely for production readiness
export const FIELD_VOLUNTEERS: { id: string; nameAr: string; governorate: string }[] = [];
export const FICTIONAL_TENANTS: MockTenant[] = [];
export const FICTIONAL_CASES: MockCase[] = [];
export const FICTIONAL_DONATIONS: MockDonation[] = [];
export const FICTIONAL_DELIVERIES: MockDelivery[] = [];
export const FICTIONAL_SHARING_REQUESTS: MockSharingRequest[] = [];
export const FICTIONAL_AUDIT_LOGS: MockAuditLog[] = [];
export const FICTIONAL_CONSENTS: MockConsentItem[] = [];
export const FICTIONAL_CONSENSTS = FICTIONAL_CONSENTS;
