"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AID_CATEGORIES_LABELS,
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

export default function SanadDynamicPlatformPage() {
  const [activeView, setActiveView] = useState<ActiveRoleView>("AUTH_LOGIN_REGISTER");
  const [tenants, setTenants] = useState<MockTenant[]>([]);
  const [cases, setCases] = useState<MockCase[]>([]);
  const [donations, setDonations] = useState<MockDonation[]>([]);
  const [deliveries, setDeliveries] = useState<MockDelivery[]>([]);
  const [sharingRequests, setSharingRequests] = useState<MockSharingRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<MockAuditLog[]>([]);
  const [consents, setConsents] = useState<MockConsentItem[]>([]);

  const [selectedAssnTenantId, setSelectedAssnTenantId] = useState<string>("");
  const [selectedIndTenantId, setSelectedIndTenantId] = useState<string>("");

  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const notify = (
    message: string,
    type: "success" | "warning" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

  const fetchLiveDatabaseState = useCallback(async () => {
    setLoadingDb(true);
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) {
        if (Array.isArray(data.tenants)) setTenants(data.tenants);
        if (Array.isArray(data.cases)) setCases(data.cases);
        if (Array.isArray(data.donations)) setDonations(data.donations);
        if (Array.isArray(data.deliveries)) setDeliveries(data.deliveries);
        if (Array.isArray(data.sharingRequests))
          setSharingRequests(data.sharingRequests);
        if (Array.isArray(data.consents)) setConsents(data.consents);
        if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      }
    } catch {
      // Network error
    } finally {
      setLoadingDb(false);
    }
  }, []);

  const executeLiveAction = async (
    action: string,
    payload: Record<string, unknown>,
    audit: {
      actorNameAr: string;
      actorRoleAr: string;
      actionCode: string;
      descriptionAr: string;
      tenantNameAr: string;
    }
  ) => {
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          payload: {
            ...payload,
            audit,
          },
        }),
      });
      await fetchLiveDatabaseState();
    } catch {
      // Ignore network error
    }
  };

  // Purge any old cached browser keys and load live data from Neon PostgreSQL on mount
  useEffect(() => {
    try {
      window.localStorage.removeItem("sanad_interactive_state_v1");
      window.localStorage.removeItem("sanad_interactive_state_v2");
      window.localStorage.removeItem("sanad_live_state_v3");

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
    } catch {
      // Ignore
    }
    void fetchLiveDatabaseState();
  }, [fetchLiveDatabaseState]);

  // Super Admin Handlers
  const handleUpdateTenantStatus = (tenantId: string, status: TenantStatus) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status } : t))
    );
    void executeLiveAction(
      "UPDATE_TENANT_STATUS",
      { tenantId, status },
      {
        actorNameAr: "م. محمود هاشم (eng.mhashim@gmail.com)",
        actorRoleAr: "SUPER_ADMIN",
        actionCode: status === "ACTIVE" ? "TENANT_APPROVED" : "TENANT_SUSPENDED",
        descriptionAr:
          status === "ACTIVE"
            ? `اعتماد وتفعيل الجهة (${target.nameAr}) للعمل على المنصة`
            : `إيقاف مؤقت للجهة (${target.nameAr}) للمراجعة الرقابية`,
        tenantNameAr: target.nameAr,
      }
    );
    notify(
      status === "ACTIVE"
        ? `تم اعتماد وتفعيل "${target.nameAr}" في قاعدة البيانات بنجاح.`
        : `تم إيقاف "${target.nameAr}" مؤقتاً في قاعدة البيانات.`,
      status === "ACTIVE" ? "success" : "warning"
    );
  };

  const handleCreateTenant = (payload: {
    nameAr: string;
    type: "ASSOCIATION" | "INDIVIDUAL";
    governorate: string;
    registrationNumber?: string;
  }) => {
    void executeLiveAction(
      "CREATE_TENANT",
      payload,
      {
        actorNameAr: "م. محمود هاشم (eng.mhashim@gmail.com)",
        actorRoleAr: "SUPER_ADMIN",
        actionCode: "TENANT_REGISTERED",
        descriptionAr: `إدراج كيان جديد (${payload.nameAr}) بانتظار الاعتماد`,
        tenantNameAr: payload.nameAr,
      }
    );
    notify(
      `تم إدراج "${payload.nameAr}" وحفظه مباشرة في قاعدة بيانات Neon PostgreSQL.`,
      "success"
    );
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
    void executeLiveAction(
      "DECIDE_SHARING_REQUEST",
      { requestId, decision },
      {
        actorNameAr: "م. محمود هاشم (eng.mhashim@gmail.com)",
        actorRoleAr: "SUPER_ADMIN",
        actionCode:
          decision === "APPROVED" ? "DATA_SHARING_GRANTED" : "DATA_SHARING_DENIED",
        descriptionAr: `${
          decision === "APPROVED" ? "الموافقة على" : "رفض"
        } طلب مشاركة ملف المستفيد (${req.beneficiaryNameAr}) لصالح (${
          req.requestingTenantNameAr
        })`,
        tenantNameAr: req.owningTenantNameAr,
      }
    );
    notify(
      decision === "APPROVED"
        ? "تمت الموافقة على مشاركة البيانات المحددة وتحديث قاعدة البيانات."
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
    const prefix = tenant?.type === "INDIVIDUAL" ? "IND" : "CASE";
    const caseNumber = `${prefix}-2026-${Date.now().toString().slice(-4)}`;

    void executeLiveAction(
      "CREATE_CASE",
      { ...payload, caseNumber },
      {
        actorNameAr:
          tenant?.type === "INDIVIDUAL"
            ? "سارة عبد الرحمن المنصوري"
            : "أحمد محمود الشناوي",
        actorRoleAr:
          tenant?.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
        actionCode: "CASE_CREATED_NID_VERIFIED",
        descriptionAr: `تسجيل حالة جديدة (${caseNumber}) للمستفيد (${payload.beneficiaryNameAr}) بعد فحص الرقم القومي`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );
    notify(
      `تم تسجيل ملف الحالة (${caseNumber}) وحفظه في قاعدة بيانات Neon PostgreSQL.`,
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
    const receiptNumber = `RCP-2026-${Date.now().toString().slice(-4)}`;

    void executeLiveAction(
      "CREATE_DONATION",
      { ...payload, receiptNumber },
      {
        actorNameAr:
          tenant?.type === "INDIVIDUAL"
            ? "سارة عبد الرحمن المنصوري"
            : "أحمد محمود الشناوي",
        actorRoleAr:
          tenant?.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
        actionCode: "DONATION_RECORDED",
        descriptionAr: `إصدار إيصال تبرع (${receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
          "ar-EG"
        )} ج.م — الحالة: ${payload.initialStatus}`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );
    notify(
      `تم تسجيل التبرع (${receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
        "ar-EG"
      )} ج.م في قاعدة البيانات.`,
      "success"
    );
  };

  const handleConfirmDonation = (donationId: string) => {
    const targetDon = donations.find((d) => d.id === donationId);
    if (!targetDon || targetDon.status !== "PENDING_VERIFICATION") return;
    const tenant = tenants.find((t) => t.id === targetDon.tenantId) || tenants[0];

    void executeLiveAction(
      "CONFIRM_DONATION",
      { donationId },
      {
        actorNameAr: "أحمد محمود الشناوي",
        actorRoleAr: "مدير جمعية خيرية",
        actionCode: "DONATION_CONFIRMED",
        descriptionAr: `تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة ${targetDon.totalAmountEgp.toLocaleString(
          "ar-EG"
        )} ج.م للرصيد المتاح للتخصيص`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );
    notify(
      `تم تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة المبلغ للرصيد المتاح في قاعدة البيانات!`,
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

    void executeLiveAction(
      "ALLOCATE_ATOMIC",
      payload,
      {
        actorNameAr:
          tenant?.type === "INDIVIDUAL"
            ? "سارة عبد الرحمن المنصوري"
            : "أحمد محمود الشناوي",
        actorRoleAr:
          tenant?.type === "INDIVIDUAL" ? "مبادر فردي مستقل" : "مدير جمعية خيرية",
        actionCode: "ALLOCATION_RESERVED_ATOMIC",
        descriptionAr: `تخصيص ذري لمبلغ ${payload.amountEgp.toLocaleString(
          "ar-EG"
        )} ج.م من الإيصال ${donation.receiptNumber} للحالة ${
          targetCase.caseNumber
        } وجدولة التسليم`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );

    notify(
      `تم الحجز المالي الذري بمبلغ ${payload.amountEgp.toLocaleString(
        "ar-EG"
      )} ج.م للحالة (${targetCase.caseNumber}) في قاعدة البيانات!`,
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

    void executeLiveAction(
      "ASSIGN_VOLUNTEER",
      { caseId, volunteerId, volunteerNameAr },
      {
        actorNameAr: "د. منى الشاذلي",
        actorRoleAr: "مشرف البحث الاجتماعي",
        actionCode: "RESEARCH_ASSIGNED",
        descriptionAr: `إسناد الزيارة الميدانية للحالة (${target.caseNumber}) إلى الباحث (${volunteerNameAr})`,
        tenantNameAr: "إدارة البحث الاجتماعي",
      }
    );
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
      void executeLiveAction(
        "SOD_VIOLATION_BLOCKED",
        { caseId },
        {
          actorNameAr: target.assignedVolunteerAr,
          actorRoleAr: "محاولة اعتماد ذاتي",
          actionCode: sodCheck.ruleCode,
          descriptionAr: sodCheck.reasonAr,
          tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
        }
      );
      notify(sodCheck.reasonAr, "error");
      return;
    }

    void executeLiveAction(
      "REVIEW_DECISION",
      { caseId, decision },
      {
        actorNameAr: "د. منى الشاذلي",
        actorRoleAr: "مشرف البحث الاجتماعي",
        actionCode: `ELIGIBILITY_${decision}`,
        descriptionAr: `إصدار قرار الأهلية (${decision}) للحالة (${target.caseNumber}) بعد التحقق من فصل المهام`,
        tenantNameAr: "إدارة البحث الاجتماعي",
      }
    );

    if (decision === "NEEDS_REVISION") {
      notify(
        `تمت إعادة تقرير الحالة (${target.caseNumber}) للباحث الميداني لاستكمال البيانات.`,
        "warning"
      );
      return;
    }

    notify(
      `تم اعتماد قرار الأهلية (${decision}) للحالة (${target.caseNumber}) في قاعدة البيانات.`,
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

    void executeLiveAction(
      "SUBMIT_FIELD_REPORT",
      payload,
      {
        actorNameAr: target.assignedVolunteerAr || "أحمد سامي الكيلاني",
        actorRoleAr: "باحث / متطوع ميداني",
        actionCode: "FIELD_REPORT_SUBMITTED",
        descriptionAr: `رفع تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) للمراجعة`,
        tenantNameAr: "وحدة العمل الميداني",
      }
    );
    notify(
      `تم إرسال تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) وحفظه في قاعدة البيانات.`,
      "success"
    );
  };

  const handleConfirmDelivery = (deliveryId: string) => {
    const targetDeliv = deliveries.find((d) => d.id === deliveryId);
    if (!targetDeliv || targetDeliv.status === "CONFIRMED") return;

    void executeLiveAction(
      "CONFIRM_DELIVERY",
      { deliveryId },
      {
        actorNameAr: targetDeliv.assignedVolunteerAr,
        actorRoleAr: "باحث / متطوع ميداني",
        actionCode: "DELIVERY_CONFIRMED_IDEMPOTENT",
        descriptionAr: `تأكيد التسليم الفعلي للحالة (${targetDeliv.caseNumber}) بمفتاح عدم تكرار (${targetDeliv.idempotencyKey})`,
        tenantNameAr: "وحدة تسليم المساعدات",
      }
    );
    notify(
      `تم تأكيد وتوثيق التسليم الفعلي للحالة (${targetDeliv.caseNumber}) في قاعدة البيانات.`,
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
    void executeLiveAction(
      "SOD_VOLUNTEER_BLOCKED",
      {},
      {
        actorNameAr: "أحمد سامي الكيلاني",
        actorRoleAr: "باحث / متطوع ميداني",
        actionCode: check.ruleCode,
        descriptionAr: check.reasonAr,
        tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
      }
    );
  };

  // Beneficiary Portal Handlers
  const handleSubmitBeneficiaryRequest = (payload: {
    tenantId: string;
    category: AidCategoryCode;
    requestedEgp: number;
    notesAr: string;
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const caseNumber = `REQ-2026-${Date.now().toString().slice(-4)}`;

    void executeLiveAction(
      "SUBMIT_BENEFICIARY_REQUEST",
      {
        ...payload,
        caseNumber,
        beneficiaryNameAr: "فاطمة عبد الفتاح السيد",
        nationalId: "27905151601234",
        phoneE164: "+201233344455",
        governorate: tenant?.governorate || "الغربية",
      },
      {
        actorNameAr: "فاطمة عبد الفتاح السيد",
        actorRoleAr: "مستفيد (BENEFICIARY)",
        actionCode: "SELF_SERVICE_REQUEST_CREATED",
        descriptionAr: `تقديم طلب مساعدة ذاتي (${caseNumber}) لدى (${
          tenant?.nameAr || "الجهة الخيرية"
        })`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );
    notify(
      `تم إرسال طلب المساعدة (${caseNumber}) وحفظه في قاعدة بيانات Neon PostgreSQL بنجاح!`,
      "success"
    );
  };

  const handleToggleConsent = (consentId: string) => {
    const target = consents.find((c) => c.id === consentId);
    if (!target) return;
    const nextState = !target.granted;

    void executeLiveAction(
      "TOGGLE_CONSENT",
      { consentId },
      {
        actorNameAr: "فاطمة عبد الفتاح السيد",
        actorRoleAr: "مستفيد (BENEFICIARY)",
        actionCode: nextState ? "CONSENT_GRANTED" : "CONSENT_REVOKED",
        descriptionAr: `${nextState ? "منح" : "إلغاء"} موافقة الخصوصية (${
          target.scopeCode
        })`,
        tenantNameAr: "بوابة المستفيد الذاتية",
      }
    );
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

  const emptyFallbackTenant: MockTenant = {
    id: "",
    type: "ASSOCIATION",
    nameAr: "جاري تحميل بيانات الجهة من قاعدة البيانات...",
    governorate: "مصر",
    status: "ACTIVE",
    beneficiariesCount: 0,
    activeCasesCount: 0,
    confirmedDonationsEgp: 0,
    reservedAllocationsEgp: 0,
    availableBalanceEgp: 0,
  };

  const activeAssnTenant =
    associationTenants.find((t) => t.id === selectedAssnTenantId) ||
    associationTenants[0] ||
    tenants[0] ||
    emptyFallbackTenant;
  const activeIndTenant =
    individualTenants.find((t) => t.id === selectedIndTenantId) ||
    individualTenants[0] ||
    tenants[0] ||
    { ...emptyFallbackTenant, type: "INDIVIDUAL" };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      {/* Main Navigation Header */}
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

          <nav aria-label="تبديل الأدوار الوظيفية" className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "SUPER_ADMIN", label: "مدير المنصة" },
              { id: "ASSOCIATION_ADMIN", label: "مدير جمعية خيرية" },
              { id: "INDIVIDUAL_INITIATIVE", label: "مبادر فردي مستقل" },
              { id: "RESEARCH_SUPERVISOR", label: "مشرف البحث الاجتماعي" },
              { id: "VOLUNTEER", label: "باحث / متطوع" },
              { id: "BENEFICIARY", label: "بوابة المستفيد" },
              { id: "AUTH_LOGIN_REGISTER", label: "الدخول والتسجيل" },
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

      {/* Main Dynamic Workspace Area */}
      <main
        className={
          activeView === "AUTH_LOGIN_REGISTER"
            ? "max-w-[1440px] mx-auto px-4 py-5"
            : "max-w-7xl mx-auto px-4 py-6 space-y-6"
        }
      >
        {loadingDb && activeView !== "AUTH_LOGIN_REGISTER" && tenants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm font-bold text-slate-600 shadow-sm">
            جاري تحميل البيانات الحية من قاعدة البيانات...
          </div>
        ) : null}

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
              void fetchLiveDatabaseState();
              notify(
                `مرحباً ${payload.fullNameAr}! تم توثيق الدخول (${payload.email}) وتفعيل جلسة (${payload.targetRole}).`,
                "success"
              );
              setActiveView(payload.targetRole);
            }}
          />
        )}
      </main>
    </div>
  );
}
