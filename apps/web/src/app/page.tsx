"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
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
  canApproveResearchReport,
  validateAllocationRequest,
} from "../lib/domain/sanad-rules";
import {
  SuperAdminWorkspace,
  type ManagedUserItem,
} from "../components/SuperAdminWorkspace";
import { TenantAdminWorkspace } from "../components/TenantAdminWorkspace";
import { ResearchSupervisorWorkspace } from "../components/ResearchSupervisorWorkspace";
import { VolunteerWorkspace } from "../components/VolunteerWorkspace";
import { BeneficiaryPortalWorkspace } from "../components/BeneficiaryPortalWorkspace";
import {
  AuthNationalIdWorkspace,
  type TargetAuthRole,
  type AuthenticatedSessionUser,
} from "../components/AuthNationalIdWorkspace";

const ROLE_LABELS_AR: Record<TargetAuthRole, string> = {
  SUPER_ADMIN: "مدير المنصة المركزي",
  ASSOCIATION_ADMIN: "مدير جمعية خيرية",
  INDIVIDUAL_INITIATIVE: "مبادر فردي مستقل",
  RESEARCH_SUPERVISOR: "مشرف البحث الاجتماعي",
  VOLUNTEER: "باحث / متطوع ميداني",
  BENEFICIARY: "مستفيد",
};

export default function SanadDynamicPlatformPage() {
  const [sessionUser, setSessionUser] =
    useState<AuthenticatedSessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<TargetAuthRole>("BENEFICIARY");

  const [tenants, setTenants] = useState<MockTenant[]>([]);
  const [cases, setCases] = useState<MockCase[]>([]);
  const [donations, setDonations] = useState<MockDonation[]>([]);
  const [deliveries, setDeliveries] = useState<MockDelivery[]>([]);
  const [sharingRequests, setSharingRequests] = useState<MockSharingRequest[]>(
    []
  );
  const [auditLogs, setAuditLogs] = useState<MockAuditLog[]>([]);
  const [consents, setConsents] = useState<MockConsentItem[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUserItem[]>([]);

  const [selectedAssnTenantId, setSelectedAssnTenantId] = useState<string>("");
  const [selectedIndTenantId, setSelectedIndTenantId] = useState<string>("");

  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const notify = useCallback(
    (
      message: string,
      type: "success" | "warning" | "error" = "success"
    ) => {
      setToast({ message, type });
    },
    []
  );

  const fetchLiveDatabaseState = useCallback(async () => {
    setLoadingDb(true);
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.status === 401) {
        setSessionUser(null);
        return;
      }
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
        if (Array.isArray(data.managedUsers))
          setManagedUsers(data.managedUsers);
      }
    } catch {
      // Network error
    } finally {
      setLoadingDb(false);
    }
  }, []);

  // Verify HttpOnly session cookie on initial load
  useEffect(() => {
    try {
      window.localStorage.removeItem("sanad_interactive_state_v1");
      window.localStorage.removeItem("sanad_interactive_state_v2");
      window.localStorage.removeItem("sanad_live_state_v3");
    } catch {
      // Ignore
    }

    let cancelled = false;
    (async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data?.authenticated && data?.user) {
          const verifiedUser = data.user as AuthenticatedSessionUser;
          setSessionUser(verifiedUser);
          setActiveView(verifiedUser.role);
          if (verifiedUser.tenantId) {
            setSelectedAssnTenantId(verifiedUser.tenantId);
            setSelectedIndTenantId(verifiedUser.tenantId);
          }
          await fetchLiveDatabaseState();
        } else if (!cancelled) {
          setSessionUser(null);
        }
      } catch {
        if (!cancelled) setSessionUser(null);
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchLiveDatabaseState]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // Ignore
    } finally {
      setSessionUser(null);
      setTenants([]);
      setCases([]);
      setDonations([]);
      setDeliveries([]);
      setSharingRequests([]);
      setAuditLogs([]);
      setConsents([]);
      setSigningOut(false);
      notify("تم تسجيل الخروج وإنهاء الجلسة بأمان.", "success");
    }
  };

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
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/state", {
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
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        setSessionUser(null);
        notify(
          data?.errorAr || "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.",
          "error"
        );
        return false;
      }
      if (!res.ok || data?.ok === false) {
        notify(
          data?.errorAr || "ليس لديك الصلاحية لتنفيذ هذا الإجراء.",
          "error"
        );
        return false;
      }
      await fetchLiveDatabaseState();
      return true;
    } catch {
      notify("حدث خطأ أثناء الاتصال بالخادم", "error");
      return false;
    }
  };

  const actorDisplayName = sessionUser
    ? `${sessionUser.fullNameAr} (${sessionUser.email})`
    : "مستخدم موثق";
  const actorRoleDisplay = sessionUser
    ? ROLE_LABELS_AR[sessionUser.role]
    : "";

  // Super Admin Handlers
  const handleUpdateTenantStatus = async (
    tenantId: string,
    status: TenantStatus
  ) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;
    const ok = await executeLiveAction(
      "UPDATE_TENANT_STATUS",
      { tenantId, status },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: status === "ACTIVE" ? "TENANT_APPROVED" : "TENANT_SUSPENDED",
        descriptionAr:
          status === "ACTIVE"
            ? `اعتماد وتفعيل الجهة (${target.nameAr}) للعمل على المنصة`
            : `إيقاف مؤقت للجهة (${target.nameAr}) للمراجعة الرقابية`,
        tenantNameAr: target.nameAr,
      }
    );
    if (ok) {
      notify(
        status === "ACTIVE"
          ? `تم اعتماد وتفعيل "${target.nameAr}" في قاعدة البيانات بنجاح.`
          : `تم إيقاف "${target.nameAr}" مؤقتاً في قاعدة البيانات.`,
        status === "ACTIVE" ? "success" : "warning"
      );
    }
  };

  const handleCreateTenant = async (payload: {
    nameAr: string;
    type: "ASSOCIATION" | "INDIVIDUAL";
    governorate: string;
    registrationNumber?: string;
  }) => {
    const ok = await executeLiveAction(
      "CREATE_TENANT",
      payload,
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "TENANT_REGISTERED",
        descriptionAr: `إدراج كيان جديد (${payload.nameAr}) بانتظار الاعتماد`,
        tenantNameAr: payload.nameAr,
      }
    );
    if (ok) {
      notify(
        `تم إدراج "${payload.nameAr}" وحفظه مباشرة في قاعدة بيانات Neon PostgreSQL.`,
        "success"
      );
    }
  };

  const handleDecideSharingRequest = async (
    requestId: string,
    decision: "APPROVED" | "DENIED"
  ) => {
    const req = sharingRequests.find((r) => r.id === requestId);
    if (!req) return;
    const ok = await executeLiveAction(
      "DECIDE_SHARING_REQUEST",
      { requestId, decision },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode:
          decision === "APPROVED"
            ? "DATA_SHARING_GRANTED"
            : "DATA_SHARING_DENIED",
        descriptionAr: `${
          decision === "APPROVED" ? "الموافقة على" : "رفض"
        } طلب مشاركة ملف المستفيد (${req.beneficiaryNameAr}) لصالح (${
          req.requestingTenantNameAr
        })`,
        tenantNameAr: req.owningTenantNameAr,
      }
    );
    if (ok) {
      notify(
        decision === "APPROVED"
          ? "تمت الموافقة على مشاركة البيانات المحددة وتحديث قاعدة البيانات."
          : "تم رفض طلب مشاركة البيانات حفاظاً على الخصوصية.",
        decision === "APPROVED" ? "success" : "warning"
      );
    }
  };

  const handleAssignEmailRole = async (payload: {
    email: string;
    fullNameAr?: string;
    role: TargetAuthRole;
    tenantId?: string | null;
    tenantNameAr?: string | null;
  }) => {
    const ok = await executeLiveAction(
      "ASSIGN_EMAIL_ROLE",
      payload,
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "ROLE_ASSIGNED_BY_SUPER_ADMIN",
        descriptionAr: `تعيين الدور (${ROLE_LABELS_AR[payload.role]}) للبريد الإلكتروني (${payload.email})`,
        tenantNameAr: payload.tenantNameAr || "الإدارة المركزية لمنصة سَنَد",
      }
    );
    if (ok) {
      notify(
        `تم تعيين دور (${ROLE_LABELS_AR[payload.role]}) للبريد (${payload.email}) وحفظ صلاحياته في قاعدة البيانات!`,
        "success"
      );
    }
  };

  // Association & Individual Initiative Handlers
  const handleCreateCase = async (payload: {
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

    const ok = await executeLiveAction(
      "CREATE_CASE",
      { ...payload, caseNumber },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "CASE_CREATED_NID_VERIFIED",
        descriptionAr: `تسجيل حالة جديدة (${caseNumber}) للمستفيد (${payload.beneficiaryNameAr}) بعد فحص الرقم القومي`,
        tenantNameAr: tenant?.nameAr || sessionUser?.tenantNameAr || "الجهة الخيرية",
      }
    );
    if (ok) {
      notify(
        `تم تسجيل ملف الحالة (${caseNumber}) وحفظه في قاعدة بيانات Neon PostgreSQL.`,
        "success"
      );
    }
  };

  const handleCreateDonation = async (payload: {
    tenantId: string;
    donorNameAr: string;
    donationType: "MONETARY" | "IN_KIND";
    restrictedCategory: AidCategoryCode | "UNRESTRICTED";
    totalAmountEgp: number;
    initialStatus: "CONFIRMED" | "PENDING_VERIFICATION";
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const receiptNumber = `RCP-2026-${Date.now().toString().slice(-4)}`;

    const ok = await executeLiveAction(
      "CREATE_DONATION",
      { ...payload, receiptNumber },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "DONATION_RECORDED",
        descriptionAr: `إصدار إيصال تبرع (${receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
          "ar-EG"
        )} ج.م — الحالة: ${payload.initialStatus}`,
        tenantNameAr: tenant?.nameAr || sessionUser?.tenantNameAr || "الجهة الخيرية",
      }
    );
    if (ok) {
      notify(
        `تم تسجيل التبرع (${receiptNumber}) بقيمة ${payload.totalAmountEgp.toLocaleString(
          "ar-EG"
        )} ج.م في قاعدة البيانات.`,
        "success"
      );
    }
  };

  const handleConfirmDonation = async (donationId: string) => {
    const targetDon = donations.find((d) => d.id === donationId);
    if (!targetDon || targetDon.status !== "PENDING_VERIFICATION") return;
    const tenant =
      tenants.find((t) => t.id === targetDon.tenantId) || tenants[0];

    const ok = await executeLiveAction(
      "CONFIRM_DONATION",
      { donationId },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "DONATION_CONFIRMED",
        descriptionAr: `تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة ${targetDon.totalAmountEgp.toLocaleString(
          "ar-EG"
        )} ج.م للرصيد المتاح للتخصيص`,
        tenantNameAr: tenant?.nameAr || sessionUser?.tenantNameAr || "الجهة الخيرية",
      }
    );
    if (ok) {
      notify(
        `تم تأكيد استلام التبرع (${targetDon.receiptNumber}) وإضافة المبلغ للرصيد المتاح في قاعدة البيانات!`,
        "success"
      );
    }
  };

  const handleAllocateAtomic = async (payload: {
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

    const tenant =
      tenants.find((t) => t.id === donation.tenantId) || tenants[0];

    const ok = await executeLiveAction(
      "ALLOCATE_ATOMIC",
      payload,
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "ALLOCATION_RESERVED_ATOMIC",
        descriptionAr: `تخصيص ذري لمبلغ ${payload.amountEgp.toLocaleString(
          "ar-EG"
        )} ج.م من الإيصال ${donation.receiptNumber} للحالة ${
          targetCase.caseNumber
        } وجدولة التسليم`,
        tenantNameAr: tenant?.nameAr || sessionUser?.tenantNameAr || "الجهة الخيرية",
      }
    );

    if (ok) {
      notify(
        `تم الحجز المالي الذري بمبلغ ${payload.amountEgp.toLocaleString(
          "ar-EG"
        )} ج.م للحالة (${targetCase.caseNumber}) في قاعدة البيانات!`,
        "success"
      );
    }
  };

  // Research Supervisor Handlers
  const handleAssignVolunteer = async (
    caseId: string,
    volunteerId: string,
    volunteerNameAr: string
  ) => {
    const target = cases.find((c) => c.id === caseId);
    if (!target) return;

    const ok = await executeLiveAction(
      "ASSIGN_VOLUNTEER",
      { caseId, volunteerId, volunteerNameAr },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "RESEARCH_ASSIGNED",
        descriptionAr: `إسناد الزيارة الميدانية للحالة (${target.caseNumber}) إلى الباحث (${volunteerNameAr})`,
        tenantNameAr: "إدارة البحث الاجتماعي",
      }
    );
    if (ok) {
      notify(
        `تم إسناد الزيارة الميدانية للحالة (${target.caseNumber}) إلى الباحث ${volunteerNameAr}.`,
        "success"
      );
    }
  };

  const handleReviewDecision = async (
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
        : sessionUser?.userId || "user-sup-mona",
      authorUserId: target.assignedVolunteerId || "same-user-id",
    });

    if (!sodCheck.allowed) {
      await executeLiveAction(
        "SOD_VIOLATION_BLOCKED",
        { caseId },
        {
          actorNameAr: actorDisplayName,
          actorRoleAr: "محاولة اعتماد ذاتي",
          actionCode: sodCheck.ruleCode,
          descriptionAr: sodCheck.reasonAr,
          tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
        }
      );
      notify(sodCheck.reasonAr, "error");
      return;
    }

    const ok = await executeLiveAction(
      "REVIEW_DECISION",
      { caseId, decision },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: `ELIGIBILITY_${decision}`,
        descriptionAr: `إصدار قرار الأهلية (${decision}) للحالة (${target.caseNumber}) بعد التحقق من فصل المهام`,
        tenantNameAr: "إدارة البحث الاجتماعي",
      }
    );

    if (!ok) return;

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
  const handleSubmitFieldReport = async (payload: {
    caseId: string;
    incomeEgp: number;
    expensesEgp: number;
    notesAr: string;
  }) => {
    const target = cases.find((c) => c.id === payload.caseId);
    if (!target) return;
    const nextVersion = target.reportVersion + 1;

    const ok = await executeLiveAction(
      "SUBMIT_FIELD_REPORT",
      payload,
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "FIELD_REPORT_SUBMITTED",
        descriptionAr: `رفع تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) للمراجعة`,
        tenantNameAr: "وحدة العمل الميداني",
      }
    );
    if (ok) {
      notify(
        `تم إرسال تقرير البحث الميداني (الإصدار v${nextVersion}) للحالة (${target.caseNumber}) وحفظه في قاعدة البيانات.`,
        "success"
      );
    }
  };

  const handleConfirmDelivery = async (deliveryId: string) => {
    const targetDeliv = deliveries.find((d) => d.id === deliveryId);
    if (!targetDeliv || targetDeliv.status === "CONFIRMED") return;

    const ok = await executeLiveAction(
      "CONFIRM_DELIVERY",
      { deliveryId },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "DELIVERY_CONFIRMED_IDEMPOTENT",
        descriptionAr: `تأكيد التسليم الفعلي للحالة (${targetDeliv.caseNumber}) بمفتاح عدم تكرار (${targetDeliv.idempotencyKey})`,
        tenantNameAr: "وحدة تسليم المساعدات",
      }
    );
    if (ok) {
      notify(
        `تم تأكيد وتوثيق التسليم الفعلي للحالة (${targetDeliv.caseNumber}) في قاعدة البيانات.`,
        "success"
      );
    }
  };

  const handleVolunteerAttemptDirectApproval = async () => {
    const check = canApproveResearchReport({
      reviewerRole: "VOLUNTEER",
      reviewerUserId: sessionUser?.userId || "user-vol-ahmed",
      authorUserId: "user-vol-sara",
    });
    notify(check.reasonAr, "error");
    await executeLiveAction(
      "SOD_VOLUNTEER_BLOCKED",
      {},
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: check.ruleCode,
        descriptionAr: check.reasonAr,
        tenantNameAr: "محرك فصل المهام الرقابية (SoD Guard)",
      }
    );
  };

  // Beneficiary Portal Handlers
  const handleSubmitBeneficiaryRequest = async (payload: {
    tenantId: string;
    category: AidCategoryCode;
    requestedEgp: number;
    notesAr: string;
  }) => {
    const tenant = tenants.find((t) => t.id === payload.tenantId) || tenants[0];
    const caseNumber = `REQ-2026-${Date.now().toString().slice(-4)}`;

    const ok = await executeLiveAction(
      "SUBMIT_BENEFICIARY_REQUEST",
      {
        ...payload,
        caseNumber,
        beneficiaryNameAr: sessionUser?.fullNameAr || "مستفيد موثق",
        nationalId: "27905151601234",
        phoneE164: sessionUser?.phoneE164 || "+201233344455",
        governorate:
          sessionUser?.governorateNameAr || tenant?.governorate || "القاهرة",
      },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: "SELF_SERVICE_REQUEST_CREATED",
        descriptionAr: `تقديم طلب مساعدة ذاتي (${caseNumber}) لدى (${
          tenant?.nameAr || "الجهة الخيرية"
        })`,
        tenantNameAr: tenant?.nameAr || "الجهة الخيرية",
      }
    );
    if (ok) {
      notify(
        `تم إرسال طلب المساعدة (${caseNumber}) وحفظه في قاعدة بيانات Neon PostgreSQL بنجاح!`,
        "success"
      );
    }
  };

  const handleToggleConsent = async (consentId: string) => {
    const target = consents.find((c) => c.id === consentId);
    if (!target) return;
    const nextState = !target.granted;

    const ok = await executeLiveAction(
      "TOGGLE_CONSENT",
      { consentId },
      {
        actorNameAr: actorDisplayName,
        actorRoleAr: actorRoleDisplay,
        actionCode: nextState ? "CONSENT_GRANTED" : "CONSENT_REVOKED",
        descriptionAr: `${nextState ? "منح" : "إلغاء"} موافقة الخصوصية (${
          target.scopeCode
        })`,
        tenantNameAr: "بوابة المستفيد الذاتية",
      }
    );
    if (ok) {
      notify(
        nextState
          ? `تم تفعيل الموافقة على: "${target.titleAr}"`
          : `تم إلغاء الموافقة على: "${target.titleAr}"`,
        nextState ? "success" : "warning"
      );
    }
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

  // Effective view is strictly locked to sessionUser.role unless the user is SUPER_ADMIN
  const effectiveRoleView: TargetAuthRole = sessionUser
    ? sessionUser.role === "SUPER_ADMIN"
      ? activeView
      : sessionUser.role
    : "BENEFICIARY";

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
              <h1 className="font-bold text-lg text-slate-900">
                منصة سَنَد (SANAD)
              </h1>
              <p className="text-xs text-slate-500">
                نظام إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي الميداني
              </p>
            </div>
          </div>

          {/* Authenticated Session Bar vs Unauthenticated Lock Badge */}
          {!sessionUser ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                <span>🔒</span>
                <span>يرجى تسجيل الدخول للوصول إلى مساحات العمل</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {/* Super Admin Module Inspector (Strictly ONLY for authenticated SUPER_ADMIN) */}
              {sessionUser.role === "SUPER_ADMIN" && (
                <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-purple-900">
                    وحدة العرض (صلاحية مدير المنصة):
                  </span>
                  <select
                    aria-label="تبديل وحدة المنصة لمدير النظام"
                    value={activeView}
                    onChange={(e) =>
                      setActiveView(e.target.value as TargetAuthRole)
                    }
                    className="bg-white border border-purple-300 rounded-lg px-2 py-1 text-xs font-bold text-purple-950 focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">
                      لوحة مدير المنصة المركزي (SUPER_ADMIN)
                    </option>
                    <option value="ASSOCIATION_ADMIN">
                      معاينة وحدة الجمعيات الخيرية
                    </option>
                    <option value="INDIVIDUAL_INITIATIVE">
                      معاينة وحدة المبادرات الفردية
                    </option>
                    <option value="RESEARCH_SUPERVISOR">
                      معاينة وحدة مشرف البحث الاجتماعي
                    </option>
                    <option value="VOLUNTEER">
                      معاينة وحدة الباحث الميداني
                    </option>
                    <option value="BENEFICIARY">
                      معاينة بوابة المستفيد
                    </option>
                  </select>
                </div>
              )}

              {/* Verified User Identity & Role Badge */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>{sessionUser.fullNameAr}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      {ROLE_LABELS_AR[sessionUser.role]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>{sessionUser.email}</span>
                    <span>•</span>
                    <span className="text-purple-700 font-sans font-semibold">
                      {sessionUser.permissions.length} صلاحية مفعّلة
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {signingOut ? "جاري الخروج..." : "تسجيل الخروج"}
                </button>
              </div>
            </div>
          )}
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
          !sessionUser
            ? "max-w-[1440px] mx-auto px-4 py-5"
            : "max-w-7xl mx-auto px-4 py-6 space-y-6"
        }
      >
        {checkingAuth ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm font-bold text-slate-600 shadow-sm max-w-xl mx-auto my-12">
            جاري التحقق من جلسة الأمان وصلاحيات الدخول...
          </div>
        ) : !sessionUser ? (
          <AuthNationalIdWorkspace
            onNotify={notify}
            onAuthenticatedSuccess={(payload) => {
              setSessionUser(payload.user);
              setActiveView(payload.user.role);
              if (payload.user.tenantId) {
                setSelectedAssnTenantId(payload.user.tenantId);
                setSelectedIndTenantId(payload.user.tenantId);
              }
              void fetchLiveDatabaseState();
              notify(
                `مرحباً ${payload.user.fullNameAr}! تم توثيق الدخول (${
                  payload.user.email
                }) وتفعيل صلاحيات (${ROLE_LABELS_AR[payload.user.role]}).`,
                "success"
              );
            }}
          />
        ) : (
          <>
            {loadingDb && tenants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm font-bold text-slate-600 shadow-sm">
                جاري تحميل البيانات الحية من قاعدة البيانات وفقاً لصلاحيات دورك...
              </div>
            ) : null}

            {effectiveRoleView === "SUPER_ADMIN" &&
              sessionUser.role === "SUPER_ADMIN" && (
                <SuperAdminWorkspace
                  tenants={tenants}
                  cases={cases}
                  sharingRequests={sharingRequests}
                  auditLogs={auditLogs}
                  managedUsers={managedUsers}
                  onUpdateTenantStatus={handleUpdateTenantStatus}
                  onCreateTenant={handleCreateTenant}
                  onDecideSharingRequest={handleDecideSharingRequest}
                  onAssignEmailRole={handleAssignEmailRole}
                />
              )}

            {effectiveRoleView === "ASSOCIATION_ADMIN" && (
              <TenantAdminWorkspace
                mode="ASSOCIATION"
                currentTenant={activeAssnTenant}
                availableTenantsOfType={associationTenants}
                onSelectTenantId={setSelectedAssnTenantId}
                scopedCases={cases.filter(
                  (c) => c.tenantId === activeAssnTenant.id
                )}
                scopedDonations={donations.filter(
                  (d) => d.tenantId === activeAssnTenant.id
                )}
                onCreateCase={handleCreateCase}
                onCreateDonation={handleCreateDonation}
                onConfirmDonation={handleConfirmDonation}
                onAllocateAtomic={handleAllocateAtomic}
              />
            )}

            {effectiveRoleView === "INDIVIDUAL_INITIATIVE" && (
              <TenantAdminWorkspace
                mode="INDIVIDUAL"
                currentTenant={activeIndTenant}
                availableTenantsOfType={individualTenants}
                onSelectTenantId={setSelectedIndTenantId}
                scopedCases={cases.filter(
                  (c) => c.tenantId === activeIndTenant.id
                )}
                scopedDonations={donations.filter(
                  (d) => d.tenantId === activeIndTenant.id
                )}
                onCreateCase={handleCreateCase}
                onCreateDonation={handleCreateDonation}
                onConfirmDonation={handleConfirmDonation}
                onAllocateAtomic={handleAllocateAtomic}
              />
            )}

            {effectiveRoleView === "RESEARCH_SUPERVISOR" && (
              <ResearchSupervisorWorkspace
                cases={cases}
                onAssignVolunteer={handleAssignVolunteer}
                onReviewDecision={handleReviewDecision}
              />
            )}

            {effectiveRoleView === "VOLUNTEER" && (
              <VolunteerWorkspace
                cases={cases}
                deliveries={deliveries}
                onSubmitFieldReport={handleSubmitFieldReport}
                onConfirmDelivery={handleConfirmDelivery}
                onAttemptDirectApproval={handleVolunteerAttemptDirectApproval}
              />
            )}

            {effectiveRoleView === "BENEFICIARY" && (
              <BeneficiaryPortalWorkspace
                tenants={tenants}
                cases={cases}
                deliveries={deliveries}
                consents={consents}
                onSubmitBeneficiaryRequest={handleSubmitBeneficiaryRequest}
                onToggleConsent={handleToggleConsent}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
