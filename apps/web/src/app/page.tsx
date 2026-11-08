"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AID_CATEGORIES_LABELS,
  FICTIONAL_TENANTS,
  FICTIONAL_CASES,
  FICTIONAL_DONATIONS,
  FICTIONAL_DELIVERIES,
  FICTIONAL_SHARING_REQUESTS,
  FICTIONAL_AUDIT_LOGS,
  FICTIONAL_CONSENTS,
  type AidCategoryCode,
  type MockTenant,
  type MockCase,
  type MockDonation,
  type MockDelivery,
  type MockSharingRequest,
  type MockAuditLog,
  type MockConsentItem,
  type TenantStatus,
  type EligibilityDecision,
} from "../lib/mock-data/fictional-seed";
import {
  maskEgyptianNationalId,
  canApproveResearchReport,
  validateAllocationRequest,
} from "../lib/domain/sanad-rules";
import { DatabaseSetupModal } from "../components/DatabaseSetupModal";
import { SuperAdminWorkspace } from "../components/SuperAdminWorkspace";
import { TenantAdminWorkspace } from "../components/TenantAdminWorkspace";
import { ResearchSupervisorWorkspace } from "../components/ResearchSupervisorWorkspace";
import { VolunteerWorkspace } from "../components/VolunteerWorkspace";
import { BeneficiaryPortalWorkspace } from "../components/BeneficiaryPortalWorkspace";
import {
  AuthNationalIdWorkspace,
  type TargetAuthRole,
} from "../components/AuthNationalIdWorkspace";

type ActiveRoleView =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY"
  | "AUTH_LOGIN_REGISTER";

const STORAGE_KEY = "sanad_interactive_state_v2";

export default function SanadWorkspacePreviewPage() {
  const [activeView, setActiveView] = useState<ActiveRoleView>("AUTH_LOGIN_REGISTER");
  const [tenants, setTenants] = useState<MockTenant[]>(FICTIONAL_TENANTS);
  const [cases, setCases] = useState<MockCase[]>(FICTIONAL_CASES);
  const [donations, setDonations] = useState<MockDonation[]>(FICTIONAL_DONATIONS);
  const [deliveries, setDeliveries] = useState<MockDelivery[]>(FICTIONAL_DELIVERIES);
  const [sharingRequests, setSharingRequests] = useState<MockSharingRequest[]>(
    FICTIONAL_SHARING_REQUESTS
  );
  const [auditLogs, setAuditLogs] = useState<MockAuditLog[]>(FICTIONAL_AUDIT_LOGS);
  const [consents, setConsents] = useState<MockConsentItem[]>(FICTIONAL_CONSENTS);

  const [selectedAssnTenantId, setSelectedAssnTenantId] = useState<string>(
    "tenant-assn-noor-tanta"
  );
  const [selectedIndTenantId, setSelectedIndTenantId] = useState<string>(
    "tenant-ind-tarek-mansoura"
  );

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const notify = (
    message: string,
    type: "success" | "warning" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

  const appendAudit = (params: {
    actorNameAr: string;
    actorRoleAr: string;
    actionCode: string;
    descriptionAr: string;
    tenantNameAr: string;
  }) => {
    const newEntry: MockAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      ...params,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Load persisted state & URL ?view= parameter on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as ActiveRoleView | null;
      if (
        viewParam &&
        [
          "SUPER_ADMIN",
          "ASSOCIATION_ADMIN",
          "INDIVIDUAL_INITIATIVE",
          "RESEARCH_SUPERVISOR",
          "VOLUNTEER",
          "BENEFICIARY",
          "AUTH_LOGIN_REGISTER",
        ].includes(viewParam)
      ) {
        setActiveView(viewParam);
      }

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tenants)) setTenants(parsed.tenants);
        if (Array.isArray(parsed.cases)) setCases(parsed.cases);
        if (Array.isArray(parsed.donations)) setDonations(parsed.donations);
        if (Array.isArray(parsed.deliveries)) setDeliveries(parsed.deliveries);
        if (Array.isArray(parsed.sharingRequests))
          setSharingRequests(parsed.sharingRequests);
        if (Array.isArray(parsed.auditLogs)) setAuditLogs(parsed.auditLogs);
        if (Array.isArray(parsed.consents)) setConsents(parsed.consents);
      }
    } catch {
      // Ignore storage read errors in restricted environments
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save state to localStorage when updated
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tenants,
          cases,
          donations,
          deliveries,
          sharingRequests,
          auditLogs,
          consents,
        })
      );
    } catch {
      // Ignore storage write errors
    }
  }, [
    hydrated,
    tenants,
    cases,
    donations,
    deliveries,
    sharingRequests,
    auditLogs,
    consents,
  ]);

  const handleResetDemoData = () => {
    setTenants(FICTIONAL_TENANTS);
    setCases(FICTIONAL_CASES);
    setDonations(FICTIONAL_DONATIONS);
    setDeliveries(FICTIONAL_DELIVERIES);
    setSharingRequests(FICTIONAL_SHARING_REQUESTS);
    setAuditLogs(FICTIONAL_AUDIT_LOGS);
    setConsents(FICTIONAL_CONSENTS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    notify("تمت إعادة ضبط جميع البيانات التجريبية إلى الحالة القياسية بنجاح.", "success");
  };

  // Super Admin Handlers
  const handleUpdateTenantStatus = (tenantId: string, status: TenantStatus) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status } : t))
    );
    appendAudit({
      actorNameAr: "مدير المنصة المركزي",
      actorRoleAr: "SUPER_ADMIN",
      actionCode: status === "ACTIVE" ? "TENANT_APPROVED" : "TENANT_SUSPENDED",
      descriptionAr:
        status === "ACTIVE"
          ? `اعتماد وتفعيل الجهة (${target.nameAr}) للعمل على المنصة`
          : `إيقاف مؤقت للجهة (${target.nameAr}) للمراجعة الرقابية`,
      tenantNameAr: target.nameAr,
    });
    notify(
      status === "ACTIVE"
        ? `تم اعتماد وتفعيل "${target.nameAr}" بنجاح.`
        : `تم إيقاف "${target.nameAr}" مؤقتاً.`,
      status === "ACTIVE" ? "success" : "warning"
    );
  };

  const handleCreateTenant = (payload: {
    nameAr: string;
    type: "ASSOCIATION" | "INDIVIDUAL";
    governorate: string;
    registrationNumber?: string;
  }) => {
    const newTenant: MockTenant = {
      id: `tenant-${Date.now()}`,
      type: payload.type,
      nameAr: payload.nameAr,
      governorate: payload.governorate,
      registrationNumber: payload.registrationNumber,
      status: "PENDING_APPROVAL",
      beneficiariesCount: 0,
      activeCasesCount: 0,
      confirmedDonationsEgp: 0,
      reservedAllocationsEgp: 0,
      availableBalanceEgp: 0,
    };
    setTenants((prev) => [newTenant, ...prev]);
    appendAudit({
      actorNameAr: "مدير المنصة المركزي",
      actorRoleAr: "SUPER_ADMIN",
      actionCode: "TENANT_REGISTERED",
      descriptionAr: `إدراج كيان جديد (${payload.nameAr}) بانتظار الاعتماد`,
      tenantNameAr: payload.nameAr,
    });
    notify(`تم إدراج "${payload.nameAr}" ضمن قائمة الجهات بانتظار الاعتماد.`, "success");
  };

  const handleDecideSharingRequest = (
    requestId: string,
    decision: "APPROVED" | "DENIED"
  ) => {
    const req = sharingRequests.find((r) => r.id === requestId);
    if (!req) return;
    setSharingRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: decision } : r))
    );
    appendAudit({
      actorNameAr: "مدير المنصة المركزي",
      actorRoleAr: "SUPER_ADMIN",
      actionCode:
        decision === "APPROVED" ? "DATA_SHARING_GRANTED" : "DATA_SHARING_DENIED",
      descriptionAr: `${
        decision === "APPROVED" ? "الموافقة على" : "رفض"
      } طلب مشاركة ملف المستفيد (${req.beneficiaryNameAr}) لصالح (${req.requestingTenantNameAr})`,
      tenantNameAr: req.owningTenantNameAr,
    });
    notify(
      decision === "APPROVED"
        ? "تمت الموافقة على مشاركة البيانات المحددة بين الجهتين."
        : "تم رفض طلب مشاركة البيانات حفاظاً على الخصوصية.",
      decision === "APPROVED" ? "success" : "warning"
    );
  };

  // Association & Individual Initiative Handlers
  const handleCreateCase = (payload: {
    tenantId: string;
    beneficiaryNameAr: string;
    nationalId: string;
    phoneE164: string;
    governorate: string;
    targetType: "HOUSEHOLD" | "PERSON";
    category: AidCategoryCode;
    requestedEgp: number;
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const prefix = tenant.type === "INDIVIDUAL" ? "IND" : "CASE";
    const newCase: MockCase = {
      id: `case-${Date.now()}`,
      tenantId: tenant.id,
      caseNumber: `${prefix}-2026-0${cases.length + 140}`,
      beneficiaryNameAr: payload.beneficiaryNameAr,
      nationalId: payload.nationalId,
      maskedNationalId: maskEgyptianNationalId(payload.nationalId),
      phoneE164: payload.phoneE164,
      householdCode: `HH-${payload.governorate.slice(0, 2)}-0${cases.length + 180}`,
      governorate: payload.governorate,
      targetType: payload.targetType,
      category: payload.category,
      categoryAr: AID_CATEGORIES_LABELS[payload.category],
      caseStatus: "NEW",
      researchStatus: "NOT_ASSIGNED",
      eligibilityDecision: "PENDING",
      allocationStatus: "UNALLOCATED",
      deliveryStatus: "PENDING",
      requestedEgp: payload.requestedEgp,
      approvedEgp: 0,
      assignedVolunteerAr: "غير مسند بعد",
      assignedVolunteerId: "",
      supervisorAr:
        tenant.type === "INDIVIDUAL" ? "أ. طارق المنشاوي" : "د. منى الشاذلي",
      householdIncomeEgp: 2500,
      householdExpensesEgp: 2500 + payload.requestedEgp,
      researchNotesAr: "ملف جديد مسجل بالرقم القومي وبانتظار إسناد الزيارة الميدانية.",
      reportVersion: 0,
    };

    setCases((prev) => [newCase, ...prev]);
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenant.id
          ? {
              ...t,
              beneficiariesCount: t.beneficiariesCount + 1,
              activeCasesCount: t.activeCasesCount + 1,
            }
          : t
      )
    );
    appendAudit({
      actorNameAr:
        tenant.type === "INDIVIDUAL" ? "أ. طارق المنشاوي" : "أ. عمرو عبد العزيز",
      actorRoleAr:
        tenant.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
      actionCode: "CASE_CREATED_NID_VERIFIED",
      descriptionAr: `تسجيل حالة جديدة (${newCase.caseNumber}) للمستفيد (${newCase.beneficiaryNameAr}) بعد فحص الرقم القومي`,
      tenantNameAr: tenant.nameAr,
    });
    notify(
      `تم تسجيل ملف الحالة (${newCase.caseNumber}) بنجاح ضمن نطاق ${tenant.nameAr}.`,
      "success"
    );
  };

  const handleCreateDonation = (payload: {
    tenantId: string;
    donorNameAr: string;
    donationType: "MONETARY" | "IN_KIND";
    restrictedCategory: AidCategoryCode | "UNRESTRICTED";
    totalAmountEgp: number;
    initialStatus: "CONFIRMED" | "PENDING_VERIFICATION";
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const isConfirmed = payload.initialStatus === "CONFIRMED";
    const newDonation: MockDonation = {
      id: `don-${Date.now()}`,
      tenantId: tenant.id,
      receiptNumber: `RCP-2026-${9010 + donations.length}`,
      donorNameAr: payload.donorNameAr,
      donationType: payload.donationType,
      status: payload.initialStatus,
      restrictedCategory: payload.restrictedCategory,
      restrictedCategoryAr:
        payload.restrictedCategory === "UNRESTRICTED"
          ? "غير مقيد (متاح لكافة مصارف الخير المعتمدة)"
          : `مقيد: ${AID_CATEGORIES_LABELS[payload.restrictedCategory]}`,
      totalAmountEgp: payload.totalAmountEgp,
      reservedAmountEgp: 0,
      deliveredAmountEgp: 0,
      availableAmountEgp: isConfirmed ? payload.totalAmountEgp : 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setDonations((prev) => [newDonation, ...prev]);
    if (isConfirmed) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id
            ? {
                ...t,
                confirmedDonationsEgp:
                  t.confirmedDonationsEgp + payload.totalAmountEgp,
                availableBalanceEgp:
                  t.availableBalanceEgp + payload.totalAmountEgp,
              }
            : t
        )
      );
    }

    appendAudit({
      actorNameAr:
        tenant.type === "INDIVIDUAL" ? "أ. طارق المنشاوي" : "أ. عمرو عبد العزيز",
      actorRoleAr:
        tenant.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
      actionCode: "DONATION_RECORDED",
      descriptionAr: `إصدار إيصال تبرع (${newDonation.receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
        "ar-EG"
      )} ج.م — الحالة: ${newDonation.status}`,
      tenantNameAr: tenant.nameAr,
    });
    notify(
      `تم تسجيل التبرع (${newDonation.receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
        "ar-EG"
      )} ج.م بنجاح.`,
      "success"
    );
  };

  const handleConfirmDonation = (donationId: string) => {
    const targetDon = donations.find((d) => d.id === donationId);
    if (!targetDon || targetDon.status !== "PENDING_VERIFICATION") return;

    const tenant = tenants.find((t) => t.id === targetDon.tenantId) || tenants[0];
    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status: "CONFIRMED",
              availableAmountEgp: d.totalAmountEgp,
            }
          : d
      )
    );
    setTenants((prev) =>
      prev.map((t) =>
        t.id === targetDon.tenantId
          ? {
              ...t,
              confirmedDonationsEgp:
                t.confirmedDonationsEgp + targetDon.totalAmountEgp,
              availableBalanceEgp:
                t.availableBalanceEgp + targetDon.totalAmountEgp,
            }
          : t
      )
    );

    appendAudit({
      actorNameAr: "أ. عمرو عبد العزيز",
      actorRoleAr: "مدير جمعية خيرية",
      actionCode: "DONATION_CONFIRMED",
      descriptionAr: `تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة ${targetDon.totalAmountEgp.toLocaleString(
        "ar-EG"
      )} ج.م للرصيد المتاح للتخصيص`,
      tenantNameAr: tenant.nameAr,
    });
    notify(
      `تم تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة المبلغ للرصيد المتاح!`,
      "success"
    );
  };

  const handleAllocateAtomic = (payload: {
    donationId: string;
    caseId: string;
    amountEgp: number;
  }) => {
    const donation = donations.find((d) => d.id === payload.donationId);
    const targetCase = cases.find((c) => c.id === payload.caseId);
    if (!donation || !targetCase) return;

    const validation = validateAllocationRequest({
      donation,
      targetCase,
      amountEgp: payload.amountEgp,
    });

    if (!validation.allowed) {
      notify(validation.reasonAr, "error");
      return;
    }

    const tenant = tenants.find((t) => t.id === donation.tenantId) || tenants[0];

    // 1. Deduct from donation available balance & add to reserved
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donation.id) return d;
        const newAvail = d.availableAmountEgp - payload.amountEgp;
        const newReserved = d.reservedAmountEgp + payload.amountEgp;
        return {
          ...d,
          availableAmountEgp: newAvail,
          reservedAmountEgp: newReserved,
          status: newAvail === 0 ? "FULLY_ALLOCATED" : "PARTIALLY_ALLOCATED",
        };
      })
    );

    // 2. Update tenant summary balances
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenant.id
          ? {
              ...t,
              reservedAllocationsEgp:
                t.reservedAllocationsEgp + payload.amountEgp,
              availableBalanceEgp: Math.max(
                0,
                t.availableBalanceEgp - payload.amountEgp
              ),
            }
          : t
      )
    );

    // 3. Update case allocation & delivery status
    setCases((prev) =>
      prev.map((c) =>
        c.id === targetCase.id
          ? {
              ...c,
              approvedEgp: payload.amountEgp,
              allocationStatus: "RESERVED",
              deliveryStatus: "SCHEDULED",
            }
          : c
      )
    );

    // 4. Create scheduled AidDelivery task
    const newDelivery: MockDelivery = {
      id: `deliv-${Date.now()}`,
      tenantId: tenant.id,
      caseId: targetCase.id,
      caseNumber: targetCase.caseNumber,
      beneficiaryNameAr: targetCase.beneficiaryNameAr,
      descriptionAr: `صرف مخصص (${targetCase.categoryAr}) من الإيصال ${donation.receiptNumber}`,
      amountEgp: payload.amountEgp,
      status: "SCHEDULED",
      assignedVolunteerAr:
        targetCase.assignedVolunteerAr !== "غير مسند بعد"
          ? targetCase.assignedVolunteerAr
          : "أحمد سامي الكيلاني",
      idempotencyKey: `IDEMP-ALLOC-${Date.now().toString(36).toUpperCase()}`,
      scheduledAt: new Date().toISOString().slice(0, 10),
    };
    setDeliveries((prev) => [newDelivery, ...prev]);

    appendAudit({
      actorNameAr:
        tenant.type === "INDIVIDUAL" ? "أ. طارق المنشاوي" : "أ. عمرو عبد العزيز",
      actorRoleAr:
        tenant.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
      actionCode: "ALLOCATION_RESERVED_ATOMIC",
      descriptionAr: `تخصيص ذري لمبلغ ${payload.amountEgp.toLocaleString(
        "ar-EG"
      )} ج.م من الإيصال ${donation.receiptNumber} للحالة ${
        targetCase.caseNumber
      } وجدولة التسليم`,
      tenantNameAr: tenant.nameAr,
    });

    notify(
      `تم الحجز المالي الذري بمبلغ ${payload.amountEgp.toLocaleString(
        "ar-EG"
      )} ج.م للحالة (${targetCase.caseNumber}) وجدولة مهمة التسليم للمتطوع!`,
      "success"
    );
  };

  // Research Supervisor Handlers
  const handleAssignVolunteer = (
    caseId: string,
    volunteerId: string,
    volunteerNameAr: string
  ) => {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              assignedVolunteerId: volunteerId,
              assignedVolunteerAr: volunteerNameAr,
              researchStatus:
                c.researchStatus === "NOT_ASSIGNED"
                  ? "ASSIGNED"
                  : c.researchStatus,
              caseStatus: c.caseStatus === "NEW" ? "UNDER_RESEARCH" : c.caseStatus,
            }
          : c
      )
    );
    appendAudit({
      actorNameAr: "د. منى الشاذلي",
      actorRoleAr: "مشرف البحث الاجتماعي",
      actionCode: "RESEARCH_ASSIGNED",
      descriptionAr: `إسناد الزيارة الميدانية للحالة (${target.caseNumber}) إلى الباحث (${volunteerNameAr})`,
      tenantNameAr: "إدارة البحث الاجتماعي",
    });
    notify(
      `تم إسناد الزيارة الميدانية للحالة (${target.caseNumber}) إلى الباحث ${volunteerNameAr}.`,
      "success"
    );
  };

  const handleReviewDecision = (
    caseId: string,
    decision: EligibilityDecision | "NEEDS_REVISION",
    simulateSelfApproval = false
  ) => {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;

    const sodCheck = canApproveResearchReport({
      reviewerRole: "RESEARCH_SUPERVISOR",
      reviewerUserId: simulateSelfApproval
        ? target.assignedVolunteerId || "same-user-id"
        : "user-sup-mona",
      authorUserId: target.assignedVolunteerId || "same-user-id",
    });

    if (!sodCheck.allowed) {
      appendAudit({
        actorNameAr: target.assignedVolunteerAr,
        actorRoleAr: "محاولة اعتماد ذاتي",
        actionCode: sodCheck.ruleCode,
        descriptionAr: sodCheck.reasonAr,
        tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
      });
      notify(sodCheck.reasonAr, "error");
      return;
    }

    if (decision === "NEEDS_REVISION") {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                researchStatus: "NEEDS_REVISION",
                caseStatus: "UNDER_RESEARCH",
              }
            : c
        )
      );
      notify(
        `تمت إعادة تقرير الحالة (${target.caseNumber}) للباحث الميداني لاستكمال البيانات.`,
        "warning"
      );
      return;
    }

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              researchStatus: "REVIEWED",
              eligibilityDecision: decision,
              caseStatus: decision === "INELIGIBLE" ? "REJECTED" : "APPROVED",
              approvedEgp:
                decision === "INELIGIBLE" ? 0 : c.requestedEgp,
            }
          : c
      )
    );

    appendAudit({
      actorNameAr: "د. منى الشاذلي",
      actorRoleAr: "مشرف البحث الاجتماعي",
      actionCode: `ELIGIBILITY_${decision}`,
      descriptionAr: `إصدار قرار الأهلية (${decision}) للحالة (${target.caseNumber}) بعد التحقق من فصل المهام`,
      tenantNameAr: "إدارة البحث الاجتماعي",
    });
    notify(
      `تم اعتماد قرار الأهلية (${decision}) للحالة (${target.caseNumber}) بنجاح.`,
      decision === "INELIGIBLE" ? "warning" : "success"
    );
  };

  // Volunteer Handlers
  const handleSubmitFieldReport = (payload: {
    caseId: string;
    incomeEgp: number;
    expensesEgp: number;
    notesAr: string;
  }) => {
    const target = cases.find((c) => c.id === payload.caseId);
    if (!target) return;
    const nextVersion = target.reportVersion + 1;

    setCases((prev) =>
      prev.map((c) =>
        c.id === payload.caseId
          ? {
              ...c,
              householdIncomeEgp: payload.incomeEgp,
              householdExpensesEgp: payload.expensesEgp,
              researchNotesAr: payload.notesAr,
              reportVersion: nextVersion,
              researchStatus: "SUBMITTED",
              caseStatus: "RESEARCH_SUBMITTED",
            }
          : c
      )
    );

    appendAudit({
      actorNameAr: target.assignedVolunteerAr || "أحمد سامي الكيلاني",
      actorRoleAr: "باحث / متطوع ميداني",
      actionCode: "FIELD_REPORT_SUBMITTED",
      descriptionAr: `رفع تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) للمراجعة`,
      tenantNameAr: "وحدة العمل الميداني",
    });
    notify(
      `تم إرسال تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) إلى مشرف البحث الاجتماعي.`,
      "success"
    );
  };

  const handleConfirmDelivery = (deliveryId: string) => {
    const targetDeliv = deliveries.find((d) => d.id === deliveryId);
    if (!targetDeliv || targetDeliv.status === "CONFIRMED") return;

    const nowStamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? { ...d, status: "CONFIRMED", confirmedAt: nowStamp }
          : d
      )
    );
    setCases((prev) =>
      prev.map((c) =>
        c.id === targetDeliv.caseId
          ? {
              ...c,
              deliveryStatus: "CONFIRMED",
              allocationStatus: "DISBURSED",
              caseStatus: "COMPLETED",
            }
          : c
      )
    );

    appendAudit({
      actorNameAr: targetDeliv.assignedVolunteerAr,
      actorRoleAr: "باحث / متطوع ميداني",
      actionCode: "DELIVERY_CONFIRMED_IDEMPOTENT",
      descriptionAr: `تأكيد التسليم الفعلي للحالة (${targetDeliv.caseNumber}) بمفتاح عدم تكرار (${targetDeliv.idempotencyKey})`,
      tenantNameAr: "وحدة تسليم المساعدات",
    });
    notify(
      `تم تأكيد وتوثيق التسليم الفعلي للحالة (${targetDeliv.caseNumber}) بمفتاح (${targetDeliv.idempotencyKey}).`,
      "success"
    );
  };

  const handleVolunteerAttemptDirectApproval = () => {
    const check = canApproveResearchReport({
      reviewerRole: "VOLUNTEER",
      reviewerUserId: "user-vol-ahmed",
      authorUserId: "user-vol-sara",
    });
    notify(check.reasonAr, "error");
    appendAudit({
      actorNameAr: "أحمد سامي الكيلاني",
      actorRoleAr: "باحث / متطوع ميداني",
      actionCode: check.ruleCode,
      descriptionAr: check.reasonAr,
      tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
    });
  };

  // Beneficiary Portal Handlers
  const handleSubmitBeneficiaryRequest = (payload: {
    tenantId: string;
    category: AidCategoryCode;
    requestedEgp: number;
    notesAr: string;
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const newCase: MockCase = {
      id: `case-ben-${Date.now()}`,
      tenantId: tenant.id,
      caseNumber: `REQ-2026-0${cases.length + 310}`,
      beneficiaryNameAr: "فاطمة عبد الرحمن السيد (طلب بوابة المستفيد)",
      nationalId: "28406121601248",
      maskedNationalId: "284061216****8",
      phoneE164: "+201012345678",
      householdCode: "HH-GH-0089",
      governorate: tenant.governorate,
      targetType: "HOUSEHOLD",
      category: payload.category,
      categoryAr: AID_CATEGORIES_LABELS[payload.category],
      caseStatus: "NEW",
      researchStatus: "NOT_ASSIGNED",
      eligibilityDecision: "PENDING",
      allocationStatus: "UNALLOCATED",
      deliveryStatus: "PENDING",
      requestedEgp: payload.requestedEgp,
      approvedEgp: 0,
      assignedVolunteerAr: "بانتظار التكليف",
      assignedVolunteerId: "",
      supervisorAr: "د. منى الشاذلي",
      householdIncomeEgp: 2400,
      householdExpensesEgp: 5900,
      researchNotesAr: payload.notesAr,
      reportVersion: 0,
    };

    setCases((prev) => [newCase, ...prev]);
    appendAudit({
      actorNameAr: "فاطمة عبد الرحمن السيد",
      actorRoleAr: "مستفيد (BENEFICIARY)",
      actionCode: "SELF_SERVICE_REQUEST_CREATED",
      descriptionAr: `تقديم طلب مساعدة ذاتي (${newCase.caseNumber}) لدى (${tenant.nameAr})`,
      tenantNameAr: tenant.nameAr,
    });
    notify(
      `تم إرسال طلب المساعدة (${newCase.caseNumber}) إلى "${tenant.nameAr}" بنجاح! يمكنك متابعته في المسار الخماسي.`,
      "success"
    );
  };

  const handleToggleConsent = (consentId: string) => {
    const target = consents.find((c) => c.id === consentId);
    if (!target) return;
    const nextState = !target.granted;
    const today = new Date().toISOString().slice(0, 10);

    setConsents((prev) =>
      prev.map((c) =>
        c.id === consentId ? { ...c, granted: nextState, updatedAt: today } : c
      )
    );
    appendAudit({
      actorNameAr: "فاطمة عبد الرحمن السيد",
      actorRoleAr: "مستفيد (BENEFICIARY)",
      actionCode: nextState ? "CONSENT_GRANTED" : "CONSENT_REVOKED",
      descriptionAr: `${nextState ? "منح" : "إلغاء"} موافقة الخصوصية (${
        target.scopeCode
      })`,
      tenantNameAr: "بوابة المستفيد الذاتية",
    });
    notify(
      nextState
        ? `تم تفعيل الموافقة على: "${target.titleAr}"`
        : `تم إلغاء الموافقة على: "${target.titleAr}"`,
      nextState ? "success" : "warning"
    );
  };

  // Current active tenant calculation for Association / Individual views
  const associationTenants = tenants.filter((t) => t.type === "ASSOCIATION");
  const individualTenants = tenants.filter((t) => t.type === "INDIVIDUAL");

  const activeAssnTenant =
    associationTenants.find((t) => t.id === selectedAssnTenantId) ||
    associationTenants[0] ||
    tenants[0];
  const activeIndTenant =
    individualTenants.find((t) => t.id === selectedIndTenantId) ||
    individualTenants[0] ||
    tenants[1];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Architecture & Cloud Database Bar */}
      <div className="bg-purple-950 text-purple-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-purple-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <strong>منصة سَنَد السحابية (SANAD v1.0):</strong> جميع الأدوار، النماذج، قواعد فصل المهام، والتخصيص المالي الذري تعمل تفاعلياً بالكامل مع حفظ فوري.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="bg-purple-800 hover:bg-purple-700 text-white px-3 py-1 rounded-full font-semibold transition border border-purple-600"
          >
            قاعدة البيانات والربط السحابي (39 جدول PostgreSQL)
          </button>
          <Link
            href="/login"
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-full font-semibold transition"
          >
            صفحة تسجيل الدخول الكاملة (/login) ↗
          </Link>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full font-medium transition"
          >
            إعادة ضبط البيانات التجريبية
          </button>
        </div>
      </div>

      {/* Role Switcher Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              س
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">منصة سَنَد (SANAD)</h1>
              <p className="text-xs text-slate-500">
                نظام إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي الميداني
              </p>
            </div>
          </div>

          <nav aria-label="تبديل الأدوار الوظيفية" className="flex flex-wrap gap-1.5">
            {[
              { id: "SUPER_ADMIN", label: "مدير المنصة" },
              { id: "ASSOCIATION_ADMIN", label: "مدير جمعية خيرية" },
              { id: "INDIVIDUAL_INITIATIVE", label: "مبادر فردي مستقل" },
              { id: "RESEARCH_SUPERVISOR", label: "مشرف البحث الاجتماعي" },
              { id: "VOLUNTEER", label: "باحث / متطوع" },
              { id: "BENEFICIARY", label: "بوابة المستفيد" },
              { id: "AUTH_LOGIN_REGISTER", label: "الدخول والتسجيل (الرقم القومي)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id as ActiveRoleView)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === tab.id
                    ? "bg-purple-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Live Toast Notification Banner */}
      {toast && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-xs font-bold flex items-center justify-between gap-3 shadow-sm ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : toast.type === "warning"
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-rose-50 border-rose-300 text-rose-950"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="إغلاق التنبيه"
              className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 text-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main
        className={
          activeView === "AUTH_LOGIN_REGISTER"
            ? "max-w-[1440px] mx-auto px-4 py-5"
            : "max-w-7xl mx-auto px-4 py-6 space-y-6"
        }
      >
        {activeView === "SUPER_ADMIN" && (
          <SuperAdminWorkspace
            tenants={tenants}
            cases={cases}
            sharingRequests={sharingRequests}
            auditLogs={auditLogs}
            onUpdateTenantStatus={handleUpdateTenantStatus}
            onCreateTenant={handleCreateTenant}
            onDecideSharingRequest={handleDecideSharingRequest}
          />
        )}

        {activeView === "ASSOCIATION_ADMIN" && (
          <TenantAdminWorkspace
            mode="ASSOCIATION"
            currentTenant={activeAssnTenant}
            availableTenantsOfType={associationTenants}
            onSelectTenantId={setSelectedAssnTenantId}
            scopedCases={cases.filter((c) => c.tenantId === activeAssnTenant.id)}
            scopedDonations={donations.filter(
              (d) => d.tenantId === activeAssnTenant.id
            )}
            onCreateCase={handleCreateCase}
            onCreateDonation={handleCreateDonation}
            onConfirmDonation={handleConfirmDonation}
            onAllocateAtomic={handleAllocateAtomic}
          />
        )}

        {activeView === "INDIVIDUAL_INITIATIVE" && (
          <TenantAdminWorkspace
            mode="INDIVIDUAL"
            currentTenant={activeIndTenant}
            availableTenantsOfType={individualTenants}
            onSelectTenantId={setSelectedIndTenantId}
            scopedCases={cases.filter((c) => c.tenantId === activeIndTenant.id)}
            scopedDonations={donations.filter(
              (d) => d.tenantId === activeIndTenant.id
            )}
            onCreateCase={handleCreateCase}
            onCreateDonation={handleCreateDonation}
            onConfirmDonation={handleConfirmDonation}
            onAllocateAtomic={handleAllocateAtomic}
          />
        )}

        {activeView === "RESEARCH_SUPERVISOR" && (
          <ResearchSupervisorWorkspace
            cases={cases}
            onAssignVolunteer={handleAssignVolunteer}
            onReviewDecision={handleReviewDecision}
          />
        )}

        {activeView === "VOLUNTEER" && (
          <VolunteerWorkspace
            cases={cases}
            deliveries={deliveries}
            onSubmitFieldReport={handleSubmitFieldReport}
            onConfirmDelivery={handleConfirmDelivery}
            onAttemptDirectApproval={handleVolunteerAttemptDirectApproval}
          />
        )}

        {activeView === "BENEFICIARY" && (
          <BeneficiaryPortalWorkspace
            tenants={tenants}
            cases={cases}
            deliveries={deliveries}
            consents={consents}
            onSubmitBeneficiaryRequest={handleSubmitBeneficiaryRequest}
            onToggleConsent={handleToggleConsent}
          />
        )}

        {activeView === "AUTH_LOGIN_REGISTER" && (
          <AuthNationalIdWorkspace
            onNotify={notify}
            onAuthenticatedSuccess={(payload: {
              fullNameAr: string;
              email: string;
              nationalId: string;
              phoneE164: string;
              governorateNameAr: string;
              targetRole: TargetAuthRole;
              mode: "LOGIN" | "REGISTER";
              correlationId: string;
            }) => {
              appendAudit({
                actorNameAr: payload.fullNameAr,
                actorRoleAr: payload.targetRole,
                actionCode:
                  payload.mode === "REGISTER"
                    ? "USER_REGISTERED_NID_OTP"
                    : "USER_AUTHENTICATED_NID_OTP",
                descriptionAr: `توثيق الحساب (${payload.email}) بالرقم القومي (${maskEgyptianNationalId(
                  payload.nationalId
                )}) والهاتف (${payload.phoneE164}) — معرّف: ${payload.correlationId}`,
                tenantNameAr: `محافظة ${payload.governorateNameAr}`,
              });
              notify(
                `مرحباً ${payload.fullNameAr}! تم التحقق من الرقم القومي والبريد الإلكتروني (${payload.email}) وتفعيل جلسة (${payload.targetRole}).`,
                "success"
              );
              setActiveView(payload.targetRole);
            }}
          />
        )}
      </main>

      {/* Database & Cloud Connection Modal */}
      <DatabaseSetupModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onNotify={notify}
      />
    </div>
  );
}
