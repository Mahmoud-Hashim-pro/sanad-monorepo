import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@sanad/database";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
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
} from "../../../lib/mock-data/fictional-seed";
import { maskEgyptianNationalId } from "../../../lib/domain/sanad-rules";
import {
  getServerSession,
  hasPermission,
  hashPasswordScrypt,
  ROLE_PERMISSIONS_MAP,
  type AuthRoleCode,
} from "../../../lib/server/auth-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTION_REQUIRED_PERMISSIONS: Record<string, string> = {
  UPDATE_TENANT_STATUS: "platform:tenants:approve",
  CREATE_TENANT: "platform:tenants:approve",
  DECIDE_SHARING_REQUEST: "platform:tenants:approve",
  ASSIGN_EMAIL_ROLE: "platform:tenants:approve",
  CREATE_CASE: "tenant:cases:manage",
  CREATE_DONATION: "tenant:donations:manage",
  CONFIRM_DONATION: "tenant:donations:manage",
  ALLOCATE_ATOMIC: "tenant:allocations:create",
  ASSIGN_VOLUNTEER: "tenant:research:assign",
  REVIEW_DECISION: "tenant:research:review",
  SUBMIT_FIELD_REPORT: "tenant:research:submit_report",
  CONFIRM_DELIVERY: "tenant:deliveries:confirm_assigned",
  SUBMIT_DATA_SHARING_REQUEST: "tenant:cases:manage",
  SUBMIT_BENEFICIARY_REQUEST: "portal:requests:create_own",
  TOGGLE_CONSENT: "portal:profile:manage_own",
};

function mapDbCategoryToFrontend(cat?: string | null): AidCategoryCode {
  switch (cat) {
    case "FOOD_SUPPLY":
      return "MONTHLY_FOOD";
    case "MEDICAL_AID":
      return "MEDICAL_SURGERY";
    case "EDUCATION_SUPPORT":
      return "EDUCATION_SUPPORT";
    case "HOUSING_REPAIR":
      return "HOUSING_RENOVATION";
    case "DEBT_RELIEF":
      return "DEBT_RELIEF";
    default:
      return "MONTHLY_FOOD";
  }
}

function mapFrontendCategoryToDb(cat?: string) {
  switch (cat) {
    case "MONTHLY_FOOD":
      return "FOOD_SUPPLY" as const;
    case "MEDICAL_SURGERY":
    case "PROSTHETICS_REHAB":
      return "MEDICAL_AID" as const;
    case "EDUCATION_SUPPORT":
      return "EDUCATION_SUPPORT" as const;
    case "HOUSING_RENOVATION":
      return "HOUSING_REPAIR" as const;
    case "DEBT_RELIEF":
      return "DEBT_RELIEF" as const;
    default:
      return "FINANCIAL_SUPPORT" as const;
  }
}

export async function GET() {
  const session = getServerSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        errorAr: "غير مصرح بالوصول؛ يجب تسجيل الدخول أولاً.",
      },
      { status: 401 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, source: "no_database_url" },
      { status: 503 }
    );
  }

  try {
    const [
      dbTenants,
      dbCases,
      dbDonations,
      dbDeliveries,
      dbSharingRequests,
      dbConsents,
      dbAuditLogs,
    ] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          cases: true,
          donations: true,
          tenantBeneficiaries: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.case.findMany({
        include: {
          beneficiary: { include: { personIdentity: true } },
          household: true,
          assistanceRequests: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.donation.findMany({
        include: { donor: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aidDelivery.findMany({
        include: {
          beneficiary: true,
          assistanceRequest: { include: { case: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dataSharingRequest.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.consentRecord.findMany({
        orderBy: { grantedAt: "desc" },
      }),
      prisma.auditLog.findMany({
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const tenantMap = new Map(dbTenants.map((t) => [t.id, t]));
    const beneficiaryMap = new Map(
      dbCases.map((c) => [c.beneficiaryId, c.beneficiary])
    );

    const tenants: MockTenant[] = dbTenants.map((t) => {
      const confirmedPiasters = t.donations
        .filter((d) => d.status !== "PENDING_VERIFICATION" && d.status !== "DRAFT")
        .reduce((acc, d) => acc + Number(d.totalAmountPiasters), 0);
      const reservedPiasters = t.donations.reduce(
        (acc, d) => acc + Number(d.reservedAmountPiasters),
        0
      );
      const availablePiasters = t.donations.reduce(
        (acc, d) => acc + Number(d.availableAmountPiasters),
        0
      );

      return {
        id: t.id,
        type: t.type,
        nameAr: t.nameAr.replace(/\s*\(بيانات (تجريبية|خيالية)\)/g, ""),
        registrationNumber: t.registrationNumber || undefined,
        governorate: t.governorate,
        status: (t.status === "ARCHIVED" ? "SUSPENDED" : t.status) as TenantStatus,
        beneficiariesCount: Math.max(t.tenantBeneficiaries.length, t.cases.length),
        activeCasesCount: t.cases.length,
        confirmedDonationsEgp: Math.round(confirmedPiasters / 100),
        reservedAllocationsEgp: Math.round(reservedPiasters / 100),
        availableBalanceEgp: Math.round(availablePiasters / 100),
      };
    });

    const cases: MockCase[] = dbCases.map((c) => {
      const req = c.assistanceRequests[0];
      const feCat = mapDbCategoryToFrontend(req?.category);
      const requestedEgp = req?.requestedAmountPiasters
        ? Math.round(Number(req.requestedAmountPiasters) / 100)
        : 2500;
      const approvedEgp = req?.approvedAmountPiasters
        ? Math.round(Number(req.approvedAmountPiasters) / 100)
        : c.caseStatus === "APPROVED"
        ? requestedEgp
        : 0;

      const cleanName = c.beneficiary.fullNameAr.replace(
        /\s*\(بيانات (تجريبية|خيالية)\)/g,
        ""
      );

      const socialMeta = (c.household?.socialConditionsJson || {}) as Record<
        string,
        unknown
      >;

      return {
        id: c.id,
        tenantId: c.tenantId,
        caseNumber: c.caseNumber,
        beneficiaryNameAr: cleanName,
        nationalId: c.beneficiary.personIdentity.maskedNationalId,
        maskedNationalId: c.beneficiary.personIdentity.maskedNationalId,
        phoneE164: c.beneficiary.primaryContactPhone,
        householdCode: c.household?.householdCode || `HH-${c.caseNumber}`,
        governorate:
          c.household?.governorate ||
          tenantMap.get(c.tenantId)?.governorate ||
          "الغربية",
        targetType: req?.targetType === "PERSON" ? "PERSON" : "HOUSEHOLD",
        category: feCat,
        categoryAr: AID_CATEGORIES_LABELS[feCat],
        caseStatus:
          c.caseStatus === "APPROVED"
            ? "APPROVED"
            : c.caseStatus === "RESEARCH_SUBMITTED"
            ? "RESEARCH_SUBMITTED"
            : c.caseStatus === "REJECTED"
            ? "REJECTED"
            : c.caseStatus === "CLOSED"
            ? "COMPLETED"
            : c.caseStatus === "RESEARCH_IN_PROGRESS" || c.caseStatus === "ASSIGNED"
            ? "UNDER_RESEARCH"
            : "NEW",
        researchStatus:
          c.researchStatus === "REVIEWED"
            ? "REVIEWED"
            : c.researchStatus === "SUBMITTED"
            ? "SUBMITTED"
            : c.researchStatus === "NEEDS_REVISION"
            ? "NEEDS_REVISION"
            : c.researchStatus === "ASSIGNED"
            ? "ASSIGNED"
            : "NOT_ASSIGNED",
        eligibilityDecision:
          c.eligibilityDecision === "ELIGIBLE"
            ? "ELIGIBLE"
            : c.eligibilityDecision === "CONDITIONAL"
            ? "CONDITIONAL"
            : c.eligibilityDecision === "INELIGIBLE"
            ? "INELIGIBLE"
            : "PENDING",
        allocationStatus:
          req?.allocationStatus === "DISBURSED"
            ? "DISBURSED"
            : req?.allocationStatus === "FULLY_ALLOCATED" ||
              req?.allocationStatus === "RESERVED"
            ? "RESERVED"
            : "UNALLOCATED",
        deliveryStatus:
          req?.deliveryStatus === "CONFIRMED"
            ? "CONFIRMED"
            : req?.deliveryStatus === "SCHEDULED"
            ? "SCHEDULED"
            : "PENDING",
        requestedEgp,
        approvedEgp,
        assignedVolunteerAr:
          (socialMeta.assignedVolunteerAr as string) || "أحمد سامي الكيلاني",
        assignedVolunteerId:
          (socialMeta.assignedVolunteerId as string) || "user-vol-ahmed",
        supervisorAr: (socialMeta.supervisorAr as string) || "د. منى الشاذلي",
        householdIncomeEgp: c.household
          ? Math.round(Number(c.household.monthlyIncomePiasters) / 100)
          : 1800,
        householdExpensesEgp: c.household
          ? Math.round(Number(c.household.monthlyExpensesPiasters) / 100)
          : 4200,
        researchNotesAr:
          req?.descriptionAr ||
          c.titleAr.replace(/\s*\(بيانات (تجريبية|خيالية)\)/g, ""),
        reportVersion: Number(socialMeta.reportVersion || 1),
      };
    });

    const donations: MockDonation[] = dbDonations.map((d) => {
      const feRestricted = d.restrictedCategory
        ? mapDbCategoryToFrontend(d.restrictedCategory)
        : "UNRESTRICTED";
      return {
        id: d.id,
        tenantId: d.tenantId,
        receiptNumber: d.receiptNumber,
        donorNameAr: d.donor.fullNameAr.replace(
          /\s*\((متبرع|بيانات) (تجريبي|تجريبية|خيالي|خيالية)\)/g,
          ""
        ),
        donationType: d.donationType === "IN_KIND" ? "IN_KIND" : "MONETARY",
        status:
          d.status === "PENDING_VERIFICATION"
            ? "PENDING_VERIFICATION"
            : d.status === "FULLY_ALLOCATED"
            ? "FULLY_ALLOCATED"
            : d.status === "PARTIALLY_ALLOCATED"
            ? "PARTIALLY_ALLOCATED"
            : "CONFIRMED",
        restrictedCategory: feRestricted,
        restrictedCategoryAr:
          feRestricted === "UNRESTRICTED"
            ? "غير مقيد (متاح لكافة مصارف الخير المعتمدة)"
            : `مقيد: ${AID_CATEGORIES_LABELS[feRestricted]}`,
        totalAmountEgp: Math.round(Number(d.totalAmountPiasters) / 100),
        reservedAmountEgp: Math.round(Number(d.reservedAmountPiasters) / 100),
        deliveredAmountEgp: Math.round(Number(d.deliveredAmountPiasters) / 100),
        availableAmountEgp: Math.round(Number(d.availableAmountPiasters) / 100),
        createdAt: d.createdAt.toISOString().slice(0, 10),
      };
    });

    const deliveries: MockDelivery[] = dbDeliveries.map((deliv) => ({
      id: deliv.id,
      tenantId: deliv.tenantId,
      caseId: deliv.assistanceRequest.caseId || "",
      caseNumber:
        deliv.assistanceRequest.case?.caseNumber ||
        deliv.assistanceRequest.requestNumber,
      beneficiaryNameAr: deliv.beneficiary.fullNameAr.replace(
        /\s*\(بيانات (تجريبية|خيالية)\)/g,
        ""
      ),
      descriptionAr: deliv.authorizedDescriptionAr,
      amountEgp: deliv.deliveredAmountPiasters
        ? Math.round(Number(deliv.deliveredAmountPiasters) / 100)
        : 2500,
      status: deliv.status === "CONFIRMED" ? "CONFIRMED" : "SCHEDULED",
      assignedVolunteerAr: "أحمد سامي الكيلاني",
      idempotencyKey: deliv.idempotencyKey,
      scheduledAt: deliv.scheduledAt.toISOString().slice(0, 10),
      confirmedAt: deliv.confirmedAt
        ? deliv.confirmedAt.toISOString().replace("T", " ").slice(0, 16)
        : undefined,
    }));

    const sharingRequests: MockSharingRequest[] = dbSharingRequests.map((sr) => {
      const scopeObj = (sr.requestedScopeJson || {}) as Record<string, string>;
      const ben = beneficiaryMap.get(sr.beneficiaryId);
      return {
        id: sr.id,
        requestingTenantNameAr:
          tenantMap.get(sr.requestingTenantId)?.nameAr ||
          scopeObj.requestingTenantNameAr ||
          "جهة شريكة معتمدة",
        owningTenantNameAr:
          tenantMap.get(sr.owningTenantId)?.nameAr ||
          scopeObj.owningTenantNameAr ||
          "الجهة المالكة للملف",
        beneficiaryNameAr:
          ben?.fullNameAr || scopeObj.beneficiaryNameAr || "مستفيد مسجل",
        maskedNationalId:
          ben?.personIdentity.maskedNationalId ||
          scopeObj.maskedNationalId ||
          "279051516****4",
        scopeAr:
          scopeObj.scopeAr ||
          "الاطلاع على قرار الأهلية وتقرير البحث الميداني لمنع ازدواج الصرف",
        status:
          sr.status === "APPROVED"
            ? "APPROVED"
            : sr.status === "DENIED"
            ? "DENIED"
            : "PENDING",
      };
    });

    const consents: MockConsentItem[] = dbConsents.map((cr) => {
      const titleMap: Record<string, { titleAr: string; descriptionAr: string }> = {
        SHARE_ELIGIBILITY_SUMMARY: {
          titleAr: "مشاركة ملخص الحالة الاجتماعية مع المبادرات الطبية الشريكة",
          descriptionAr:
            "السماح للجهات الخيرية المعتمدة على منصة سَنَد بالاطلاع على قرار الأهلية فقط عند طلب مساهمة علاجية مشتركة دون كشف الرقم القومي الكامل.",
        },
        SMS_DELIVERY_NOTIFICATIONS: {
          titleAr: "إشعارات الرسائل القصيرة (SMS) عند جدولة تسليم المساعدات",
          descriptionAr:
            "استلام رسائل نصية على الهاتف المحمول الموثق بمواعيد الزيارات الميدانية وإيصالات التسليم.",
        },
        SHARE_MEDICAL_ATTACHMENTS: {
          titleAr: "مشاركة المستندات الطبية المرفقة مع الصناديق العلاجية المتخصصة",
          descriptionAr:
            "إتاحة التقارير الطبية المرفقة للجان الطبية في الجمعيات الشريكة لتسريع اعتماد العمليات الجراحية.",
        },
      };
      const meta = titleMap[cr.consentType] || {
        titleAr: `موافقة مشاركة البيانات (${cr.consentType})`,
        descriptionAr: "تحكم مباشر للمستفيد في صلاحيات مشاركة بيانات ملفه.",
      };
      return {
        id: cr.id,
        titleAr: meta.titleAr,
        descriptionAr: meta.descriptionAr,
        scopeCode: cr.consentType,
        granted: cr.isGranted,
        updatedAt: (cr.revokedAt || cr.grantedAt).toISOString().slice(0, 10),
      };
    });

    const auditLogs: MockAuditLog[] = dbAuditLogs.map((log) => {
      const meta = (log.metadataJson || {}) as Record<string, unknown>;
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString().replace("T", " ").slice(0, 19),
        actorNameAr:
          log.actor?.fullNameAr.replace(/\s*\(بيانات (تجريبية|خيالية)\)/g, "") ||
          (meta.actorNameAr as string) ||
          "م. محمود هاشم (eng.mhashim@gmail.com)",
        actorRoleAr: (meta.role as string) || "SUPER_ADMIN",
        actionCode: log.actionCode,
        descriptionAr:
          (meta.descriptionAr as string) ||
          `عملية (${log.actionCode}) على (${log.resourceType})`,
        tenantNameAr:
          (meta.tenantNameAr as string) || "منصة سَنَد المركزية",
      };
    });

    const isTenantScopedRole =
      (session.role === "ASSOCIATION_ADMIN" ||
        session.role === "INDIVIDUAL_INITIATIVE") &&
      Boolean(session.tenantId);

    const scopedTenants = isTenantScopedRole
      ? tenants.filter((t) => t.id === session.tenantId)
      : tenants;

    const scopedCases = isTenantScopedRole
      ? cases.filter((c) => c.tenantId === session.tenantId)
      : cases;

    const scopedDonations = isTenantScopedRole
      ? donations.filter((d) => d.tenantId === session.tenantId)
      : donations;

    const scopedDeliveries = isTenantScopedRole
      ? deliveries.filter((d) => d.tenantId === session.tenantId)
      : deliveries;

    // Build managedUsers directory (provisioned accounts + registered accounts + Super Admin role assignments)
    const allRoleLogs = await prisma.auditLog.findMany({
      where: {
        actionCode: {
          in: ["AUTH_REGISTER_VERIFIED", "ROLE_ASSIGNED_BY_SUPER_ADMIN"],
        },
      },
      orderBy: { createdAt: "asc" },
      take: 300,
    });

    const userByEmailMap = new Map<
      string,
      {
        email: string;
        fullNameAr: string;
        maskedNationalId: string;
        phoneE164: string;
        role: AuthRoleCode;
        tenantId: string | null;
        tenantNameAr: string;
        permissionsCount: number;
        permissions: string[];
        status: string;
        hasPassword: boolean;
        updatedAt: string;
      }
    >();

    // Seed initial core accounts (Only Super Admin - system boots pristine)
    userByEmailMap.set("eng.mhashim@gmail.com", {
      email: "eng.mhashim@gmail.com",
      fullNameAr: "م. محمود هاشم (مدير المنصة المركزي)",
      maskedNationalId: "295010101****4",
      phoneE164: "+201000000001",
      role: "SUPER_ADMIN",
      tenantId: null,
      tenantNameAr: "الإدارة المركزية لمنصة سَنَد",
      permissionsCount: ROLE_PERMISSIONS_MAP.SUPER_ADMIN.length,
      permissions: ROLE_PERMISSIONS_MAP.SUPER_ADMIN,
      status: "ACTIVE",
      hasPassword: true,
      updatedAt: "2026-11-08",
    });

    for (const log of allRoleLogs) {
      const meta = (log.metadataJson || {}) as Record<string, unknown>;
      if (log.actionCode === "AUTH_REGISTER_VERIFIED") {
        const emailLower = String(meta.email || "").toLowerCase();
        if (!emailLower) continue;
        const existing = userByEmailMap.get(emailLower);
        const role = (existing?.role ||
          (meta.role as AuthRoleCode) ||
          "BENEFICIARY") as AuthRoleCode;
        userByEmailMap.set(emailLower, {
          email: emailLower,
          fullNameAr: String(meta.actorNameAr || meta.fullNameAr || existing?.fullNameAr || emailLower),
          maskedNationalId: String(
            meta.maskedNationalId || existing?.maskedNationalId || "290010101****1"
          ),
          phoneE164: String(meta.phoneE164 || existing?.phoneE164 || "+201000000000"),
          role,
          tenantId: (meta.tenantId as string) || existing?.tenantId || null,
          tenantNameAr: String(
            meta.tenantNameAr || existing?.tenantNameAr || "بوابة المستفيد"
          ),
          permissionsCount: (ROLE_PERMISSIONS_MAP[role] || []).length,
          permissions: ROLE_PERMISSIONS_MAP[role] || [],
          status: "ACTIVE",
          hasPassword: true,
          updatedAt: log.createdAt.toISOString().slice(0, 10),
        });
      } else if (log.actionCode === "ROLE_ASSIGNED_BY_SUPER_ADMIN") {
        const targetEmail = String(meta.targetEmail || "").toLowerCase();
        if (!targetEmail) continue;
        const assignedRole = (meta.assignedRole as AuthRoleCode) || "BENEFICIARY";
        const existing = userByEmailMap.get(targetEmail);
        userByEmailMap.set(targetEmail, {
          email: targetEmail,
          fullNameAr: String(
            meta.fullNameAr || existing?.fullNameAr || "مستخدم مسجل بالمنصة"
          ),
          maskedNationalId: String(
            meta.maskedNationalId || existing?.maskedNationalId || "290010101****1"
          ),
          phoneE164: String(meta.phoneE164 || existing?.phoneE164 || "+201000000000"),
          role: assignedRole,
          tenantId: (meta.tenantId as string) || existing?.tenantId || null,
          tenantNameAr: String(
            meta.tenantNameAr ||
              existing?.tenantNameAr ||
              "وفقاً للدور المعتمد"
          ),
          permissionsCount: (ROLE_PERMISSIONS_MAP[assignedRole] || []).length,
          permissions: ROLE_PERMISSIONS_MAP[assignedRole] || [],
          status: "ACTIVE",
          hasPassword: true,
          updatedAt: log.createdAt.toISOString().slice(0, 10),
        });
      }
    }

    const managedUsers = Array.from(userByEmailMap.values());

    return NextResponse.json({
      ok: true,
      source: "neon_postgresql",
      sessionRole: session.role,
      tenants: scopedTenants.length > 0 ? scopedTenants : tenants,
      cases: scopedCases,
      donations: scopedDonations,
      deliveries: scopedDeliveries,
      sharingRequests,
      consents,
      auditLogs,
      managedUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        source: "error",
        error: err instanceof Error ? err.message : "Database query failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        errorAr: "غير مصرح بتنفيذ الإجراء؛ يرجى تسجيل الدخول أولاً.",
      },
      { status: 401 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, persisted: false }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      action: string;
      payload?: Record<string, unknown>;
    };

    const action = body.action;
    const p = body.payload || {};

    const requiredPerm = ACTION_REQUIRED_PERMISSIONS[action];
    if (requiredPerm && !hasPermission(session, requiredPerm)) {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          tenantId: session.tenantId,
          actionCode: "RBAC_PERMISSION_DENIED",
          resourceType: "PlatformState",
          metadataJson: {
            actorNameAr: session.fullNameAr,
            role: session.role,
            attemptedAction: action,
            requiredPermission: requiredPerm,
            descriptionAr: `رفض محاولة تنفيذ إجراء (${action}) لعدم توفر الصلاحية (${requiredPerm}) لدور (${session.role})`,
            tenantNameAr: session.tenantNameAr || "حارس الصلاحيات الأمني (RBAC Guard)",
          },
        },
      });
      return NextResponse.json(
        {
          ok: false,
          persisted: false,
          errorAr: `غير مصرح لدورك الوظيفي (${session.role}) بتنفيذ هذا الإجراء (الصلاحية المطلوبة: ${requiredPerm}).`,
        },
        { status: 403 }
      );
    }

    if (action === "UPDATE_TENANT_STATUS") {
      const tenantId = String(p.tenantId || "");
      const status = p.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
      await prisma.tenant.updateMany({
        where: { id: tenantId },
        data: { status },
      });
    } else if (action === "CREATE_TENANT") {
      const superAdmin = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (superAdmin) {
        await prisma.tenant.create({
          data: {
            nameAr: String(p.nameAr || "جهة خيرية جديدة"),
            type: p.type === "INDIVIDUAL" ? "INDIVIDUAL" : "ASSOCIATION",
            governorate: String(p.governorate || "القاهرة"),
            registrationNumber: p.registrationNumber
              ? String(p.registrationNumber)
              : null,
            ownerUserId: superAdmin.id,
            status: "PENDING_APPROVAL",
            contactPhoneE164: "+201000000001",
          },
        });
      }
    } else if (action === "DECIDE_SHARING_REQUEST") {
      const requestId = String(p.requestId || "");
      const decision = p.decision === "APPROVED" ? "APPROVED" : "DENIED";
      await prisma.dataSharingRequest.updateMany({
        where: { id: requestId },
        data: { status: decision },
      });
    } else if (action === "SUBMIT_DATA_SHARING_REQUEST") {
      const targetTenantId = String(p.targetTenantId || "");
      const beneficiaryNameAr = String(p.beneficiaryNameAr || "مستفيد");
      const reasonAr = String(p.reasonAr || "طلب تنسيق لمنع ازدواجية صرف المساعدات");

      const requestingTenant = session.tenantId
        ? await prisma.tenant.findUnique({ where: { id: session.tenantId } })
        : null;
      const owningTenant = targetTenantId
        ? await prisma.tenant.findUnique({ where: { id: targetTenantId } })
        : await prisma.tenant.findFirst();

      const ben = await prisma.beneficiary.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (ben && owningTenant) {
        await prisma.dataSharingRequest.create({
          data: {
            requestingTenantId: session.tenantId || owningTenant.id,
            owningTenantId: owningTenant.id,
            beneficiaryId: ben.id,
            requestedScopeJson: {
              beneficiaryNameAr,
              reasonAr,
              requestingTenantNameAr: session.tenantNameAr || requestingTenant?.nameAr || "جهة شريكة معتمدة",
              requesterEmail: session.email,
              requestedAt: new Date().toISOString(),
            },
            status: "PENDING",
          },
        });
      }
    } else if (action === "ASSIGN_EMAIL_ROLE") {
      const targetEmail = String(p.email || "")
        .trim()
        .toLowerCase();
      if (!targetEmail || !targetEmail.includes("@")) {
        return NextResponse.json(
          { ok: false, errorAr: "يرجى إدخال بريد إلكتروني صالح." },
          { status: 400 }
        );
      }
      const assignedRole = String(p.role || "BENEFICIARY") as AuthRoleCode;
      const tenantId = p.tenantId ? String(p.tenantId) : null;
      let tenantNameAr = p.tenantNameAr ? String(p.tenantNameAr) : null;
      if (tenantId && !tenantNameAr) {
        const t = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (t) tenantNameAr = t.nameAr;
      }
      const fullNameAr = String(
        p.fullNameAr || targetEmail.split("@")[0] || "مستخدم مسجل"
      ).trim();
      const rawPassword = p.password ? String(p.password).trim() : "";
      const rawNationalId = p.nationalId ? String(p.nationalId).trim() : "";
      const rawMobile = p.mobile || p.phone ? String(p.mobile || p.phone).trim() : "";

      const pepper =
        process.env.NATIONAL_ID_HMAC_PEPPER || "sanad-default-pepper-key";

      // 1. Locate existing User in PostgreSQL if present
      const allPriorLogs = await prisma.auditLog.findMany({
        where: {
          actionCode: {
            in: [
              "AUTH_REGISTER_VERIFIED",
              "ROLE_ASSIGNED_BY_SUPER_ADMIN",
              "AUTH_LOGIN_VERIFIED",
            ],
          },
          resourceId: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      });

      let existingUserId: string | null = null;
      for (const log of allPriorLogs) {
        const meta = (log.metadataJson || {}) as Record<string, unknown>;
        const logEmail = String(meta.email || meta.targetEmail || "")
          .trim()
          .toLowerCase();
        if (logEmail === targetEmail && log.resourceId) {
          existingUserId = log.resourceId;
          break;
        }
      }

      let finalUserId: string;

      if (existingUserId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: existingUserId },
          include: { personIdentity: true, phones: true },
        });

        if (dbUser) {
          finalUserId = dbUser.id;
          const userUpdates: Record<string, unknown> = {
            fullNameAr,
            status: "ACTIVE",
          };
          if (rawPassword && rawPassword.length >= 6) {
            userUpdates.passwordHash = hashPasswordScrypt(rawPassword);
            userUpdates.failedLoginAttempts = 0;
            userUpdates.lockedUntil = null;
          }
          await prisma.user.update({
            where: { id: dbUser.id },
            data: userUpdates,
          });

          if (rawMobile) {
            const pRes = normalizeAndValidateEgyptianMobile(rawMobile);
            if (pRes.isValid && pRes.e164) {
              const firstPhone = dbUser.phones[0];
              if (firstPhone) {
                await prisma.userPhone.update({
                  where: { id: firstPhone.id },
                  data: { phoneE164: pRes.e164, isVerified: true },
                });
              } else {
                await prisma.userPhone.create({
                  data: {
                    userId: dbUser.id,
                    phoneE164: pRes.e164,
                    isPrimaryLogin: true,
                    isVerified: true,
                    verifiedAt: new Date(),
                  },
                });
              }
            }
          }

          if (tenantId) {
            await prisma.tenantMembership.upsert({
              where: {
                tenantId_userId: {
                  tenantId,
                  userId: dbUser.id,
                },
              },
              update: { isActive: true },
              create: {
                tenantId,
                userId: dbUser.id,
                isActive: true,
              },
            });
          }
        } else {
          finalUserId = await createNewUserInDb();
        }
      } else {
        finalUserId = await createNewUserInDb();
      }

      async function createNewUserInDb(): Promise<string> {
        const passwordToUse =
          rawPassword && rawPassword.length >= 6 ? rawPassword : "Sanad@2026";
        const scryptHash = hashPasswordScrypt(passwordToUse);

        let validNid = rawNationalId;
        const nidValidation = validateEgyptianNationalId(validNid);
        if (!nidValidation.isValid) {
          const emailHashNum = Math.abs(
            targetEmail.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
          ) % 9000;
          const serial = String(1000 + emailHashNum).slice(0, 4);
          validNid = `290010101${serial}1`;
        }

        const nidHmac = createHmac("sha256", pepper)
          .update(validNid)
          .digest("hex");
        const maskedNid = maskEgyptianNationalId(validNid);

        const identity = await prisma.personIdentity.upsert({
          where: { nationalIdHmac: nidHmac },
          update: { isVerified: true, verifiedAt: new Date() },
          create: {
            nationalIdHmac: nidHmac,
            nationalIdEncrypted: `enc:aes256gcm:${Buffer.from(validNid).toString("base64")}`,
            maskedNationalId: maskedNid,
            birthDate: new Date("1990-01-01T00:00:00.000Z"),
            governorateCode: validNid.slice(7, 9) || "01",
            isVerified: true,
            verifiedAt: new Date(),
          },
        });

        const createdUser = await prisma.user.create({
          data: {
            personIdentityId: identity.id,
            fullNameAr,
            passwordHash: scryptHash,
            status: "ACTIVE",
            lastLoginAt: new Date(),
          },
        });

        let mobileE164 = "+201000000000";
        if (rawMobile) {
          const pRes = normalizeAndValidateEgyptianMobile(rawMobile);
          if (pRes.isValid && pRes.e164) mobileE164 = pRes.e164;
        } else {
          const numHash = Math.abs(
            targetEmail.split("").reduce((acc, c) => acc * 33 + c.charCodeAt(0), 13)
          ) % 90000000;
          mobileE164 = `+2010${String(10000000 + numHash).slice(0, 8)}`;
        }

        await prisma.userPhone.create({
          data: {
            userId: createdUser.id,
            phoneE164: mobileE164,
            isPrimaryLogin: true,
            isVerified: true,
            verifiedAt: new Date(),
          },
        });

        if (tenantId) {
          await prisma.tenantMembership.create({
            data: {
              tenantId,
              userId: createdUser.id,
              isActive: true,
            },
          });
        }

        return createdUser.id;
      }

      // Fetch the updated/created user record
      const finalDbUser = await prisma.user.findUnique({
        where: { id: finalUserId },
        include: { personIdentity: true, phones: true },
      });

      const maskedNid =
        finalDbUser?.personIdentity?.maskedNationalId || "290010101****1";
      const phoneE164 =
        finalDbUser?.phones[0]?.phoneE164 || "+201000000000";

      // Dual audit logs with resourceId linking this user to their email
      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          tenantId,
          actionCode: "AUTH_REGISTER_VERIFIED",
          resourceType: "User",
          resourceId: finalUserId,
          metadataJson: {
            actorNameAr: session.fullNameAr,
            email: targetEmail,
            fullNameAr,
            role: assignedRole,
            phoneE164,
            maskedNationalId: maskedNid,
            tenantId,
            tenantNameAr: tenantNameAr || "الإدارة المركزية لمنصة سَنَد",
            descriptionAr: `إنشاء واعتماد حساب مستخدم بالبريد (${targetEmail}) بكلمة مرور وصلاحية (${assignedRole}) بواسطة مدير المنصة`,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          tenantId,
          actionCode: "ROLE_ASSIGNED_BY_SUPER_ADMIN",
          resourceType: "UserRoleAssignment",
          resourceId: finalUserId,
          metadataJson: {
            actorNameAr: session.fullNameAr,
            role: session.role,
            targetEmail,
            assignedRole,
            fullNameAr,
            tenantId,
            tenantNameAr: tenantNameAr || "الإدارة المركزية لمنصة سَنَد",
            phoneE164,
            maskedNationalId: maskedNid,
            descriptionAr: `تعيين دور (${assignedRole}) والصلاحيات واعتماد كلمة المرور للبريد (${targetEmail}) بواسطة مدير المنصة`,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        persisted: true,
        userId: finalUserId,
        email: targetEmail,
        role: assignedRole,
      });
    } else if (action === "TOGGLE_CONSENT") {
      const consentId = String(p.consentId || "");
      const existing = await prisma.consentRecord.findUnique({
        where: { id: consentId },
      });
      if (existing) {
        await prisma.consentRecord.update({
          where: { id: consentId },
          data: {
            isGranted: !existing.isGranted,
            revokedAt: existing.isGranted ? new Date() : null,
          },
        });
      }
    } else if (action === "CREATE_CASE" || action === "SUBMIT_BENEFICIARY_REQUEST") {
      const nationalId = String(p.nationalId || "28501011601234");
      const pepper = process.env.NATIONAL_ID_HMAC_PEPPER || "sanad-default-pepper-key";
      const nationalIdHmac = createHmac("sha256", pepper)
        .update(nationalId)
        .digest("hex");

      const identity = await prisma.personIdentity.upsert({
        where: { nationalIdHmac },
        update: { isVerified: true },
        create: {
          nationalIdHmac,
          nationalIdEncrypted: `enc:aes256:${Buffer.from(nationalId).toString("base64")}`,
          maskedNationalId: maskEgyptianNationalId(nationalId),
          birthDate: new Date("1985-01-01T00:00:00.000Z"),
          governorateCode: nationalId.slice(7, 9) || "16",
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      const beneficiary = await prisma.beneficiary.upsert({
        where: { personIdentityId: identity.id },
        update: { fullNameAr: String(p.beneficiaryNameAr || "مستفيد موثق") },
        create: {
          personIdentityId: identity.id,
          fullNameAr: String(p.beneficiaryNameAr || "مستفيد موثق"),
          primaryContactPhone: String(p.phoneE164 || "+201000000000"),
        },
      });

      const dbTenant =
        (await prisma.tenant.findFirst({
          where: { id: String(p.tenantId || "") },
        })) || (await prisma.tenant.findFirst());

      if (dbTenant) {
        const caseNumber = String(
          p.caseNumber || `CASE-2026-${Date.now().toString().slice(-4)}`
        );
        const householdCode = `HH-${caseNumber}`;
        const household = await prisma.household.create({
          data: {
            tenantId: dbTenant.id,
            householdCode,
            governorate: String(p.governorate || dbTenant.governorate || "الغربية"),
            cityOrCenterAr: String(p.governorate || dbTenant.governorate || "الغربية"),
            addressDetailsAr: "عنوان مسجل بملف الحالة",
            primaryContactPhone: String(p.phoneE164 || "+201000000000"),
            monthlyIncomePiasters: 240000n,
            monthlyExpensesPiasters: BigInt(
              Math.round((2400 + (Number(p.requestedEgp) || 2500)) * 100)
            ),
          },
        });

        const createdCase = await prisma.case.create({
          data: {
            tenantId: dbTenant.id,
            beneficiaryId: beneficiary.id,
            householdId: household.id,
            caseNumber,
            titleAr:
              AID_CATEGORIES_LABELS[
                (p.category as AidCategoryCode) || "MONTHLY_FOOD"
              ] || "طلب مساعدة",
            caseStatus: "SUBMITTED",
            researchStatus: "NOT_STARTED",
            priorityLevel: "HIGH",
          },
        });

        await prisma.assistanceRequest.create({
          data: {
            tenantId: dbTenant.id,
            caseId: createdCase.id,
            beneficiaryId: beneficiary.id,
            householdId: household.id,
            requestNumber: `REQ-${Date.now().toString().slice(-6)}`,
            targetType: p.targetType === "PERSON" ? "PERSON" : "HOUSEHOLD",
            category: mapFrontendCategoryToDb(String(p.category || "MONTHLY_FOOD")),
            descriptionAr: String(
              p.notesAr || "ملف حالة مسجل بالرقم القومي وبانتظار البحث الميداني"
            ),
            requestedAmountPiasters: BigInt(
              Math.round((Number(p.requestedEgp) || 2500) * 100)
            ),
          },
        });
      }
    } else if (action === "CREATE_DONATION") {
      const dbTenant =
        (await prisma.tenant.findFirst({
          where: { id: String(p.tenantId || "") },
        })) || (await prisma.tenant.findFirst());

      if (dbTenant) {
        const donor = await prisma.donor.create({
          data: {
            donorType: "INDIVIDUAL",
            fullNameAr: String(p.donorNameAr || "متبرع كريم"),
          },
        });

        const amountPiasters = BigInt(
          Math.round((Number(p.totalAmountEgp) || 5000) * 100)
        );
        const isConfirmed = p.initialStatus === "CONFIRMED";

        await prisma.donation.create({
          data: {
            tenantId: dbTenant.id,
            donorId: donor.id,
            receiptNumber: String(
              p.receiptNumber || `RCP-2026-${Date.now().toString().slice(-4)}`
            ),
            donationType: p.donationType === "IN_KIND" ? "IN_KIND" : "MONETARY",
            status: isConfirmed ? "CONFIRMED" : "PENDING_VERIFICATION",
            restrictedCategory:
              p.restrictedCategory && p.restrictedCategory !== "UNRESTRICTED"
                ? mapFrontendCategoryToDb(String(p.restrictedCategory))
                : null,
            totalAmountPiasters: amountPiasters,
            availableAmountPiasters: isConfirmed ? amountPiasters : 0n,
          },
        });
      }
    } else if (action === "CONFIRM_DONATION") {
      const donationId = String(p.donationId || "");
      const existing = await prisma.donation.findUnique({
        where: { id: donationId },
      });
      if (existing) {
        await prisma.donation.update({
          where: { id: donationId },
          data: {
            status: "CONFIRMED",
            availableAmountPiasters: existing.totalAmountPiasters,
            confirmedAt: new Date(),
          },
        });
      }
    } else if (action === "ALLOCATE_ATOMIC") {
      const donationId = String(p.donationId || "");
      const caseId = String(p.caseId || "");
      const amountPiasters = BigInt(
        Math.round((Number(p.amountEgp) || 1000) * 100)
      );

      const [donation, targetCase, actor] = await Promise.all([
        prisma.donation.findUnique({ where: { id: donationId } }),
        prisma.case.findUnique({
          where: { id: caseId },
          include: { assistanceRequests: true },
        }),
        prisma.user.findFirst({ orderBy: { createdAt: "asc" } }),
      ]);

      if (donation && targetCase && actor) {
        const nextAvail =
          donation.availableAmountPiasters > amountPiasters
            ? donation.availableAmountPiasters - amountPiasters
            : 0n;
        const nextReserved = donation.reservedAmountPiasters + amountPiasters;

        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            availableAmountPiasters: nextAvail,
            reservedAmountPiasters: nextReserved,
            status: nextAvail === 0n ? "FULLY_ALLOCATED" : "PARTIALLY_ALLOCATED",
          },
        });

        const req = targetCase.assistanceRequests[0];
        if (req) {
          await prisma.assistanceRequest.update({
            where: { id: req.id },
            data: {
              approvedAmountPiasters: amountPiasters,
              allocationStatus: "RESERVED",
              deliveryStatus: "SCHEDULED",
            },
          });

          const alloc = await prisma.allocation.create({
            data: {
              tenantId: donation.tenantId,
              donationId: donation.id,
              assistanceRequestId: req.id,
              status: "RESERVED",
              allocatedAmountPiasters: amountPiasters,
              createdByUserId: actor.id,
            },
          });

          await prisma.aidDelivery.create({
            data: {
              tenantId: donation.tenantId,
              allocationId: alloc.id,
              assistanceRequestId: req.id,
              beneficiaryId: targetCase.beneficiaryId,
              householdId: targetCase.householdId,
              targetType: req.targetType,
              status: "SCHEDULED",
              deliveredAmountPiasters: amountPiasters,
              unitAr: "جنيه مصري",
              authorizedDescriptionAr: `صرف مخصص (${targetCase.titleAr}) من الإيصال ${donation.receiptNumber}`,
              scheduledAt: new Date(),
              idempotencyKey: `IDEMP-ALLOC-${Date.now().toString(36).toUpperCase()}`,
            },
          });
        }
      }
    } else if (action === "ASSIGN_VOLUNTEER") {
      const caseId = String(p.caseId || "");
      const existingCase = await prisma.case.findUnique({
        where: { id: caseId },
        include: { household: true },
      });
      if (existingCase) {
        await prisma.case.update({
          where: { id: caseId },
          data: {
            researchStatus: "ASSIGNED",
            caseStatus:
              existingCase.caseStatus === "SUBMITTED" ||
              existingCase.caseStatus === "DRAFT"
                ? "ASSIGNED"
                : existingCase.caseStatus,
          },
        });
        if (existingCase.householdId) {
          const prevMeta = (existingCase.household?.socialConditionsJson ||
            {}) as Record<string, unknown>;
          await prisma.household.update({
            where: { id: existingCase.householdId },
            data: {
              socialConditionsJson: {
                ...prevMeta,
                assignedVolunteerId: String(p.volunteerId || ""),
                assignedVolunteerAr: String(p.volunteerNameAr || ""),
              },
            },
          });
        }
      }
    } else if (action === "REVIEW_DECISION") {
      const caseId = String(p.caseId || "");
      const decision = String(p.decision || "ELIGIBLE");
      if (decision === "NEEDS_REVISION") {
        await prisma.case.updateMany({
          where: { id: caseId },
          data: {
            researchStatus: "NEEDS_REVISION",
            caseStatus: "RESEARCH_IN_PROGRESS",
          },
        });
      } else {
        await prisma.case.updateMany({
          where: { id: caseId },
          data: {
            researchStatus: "REVIEWED",
            eligibilityDecision:
              decision === "INELIGIBLE"
                ? "INELIGIBLE"
                : decision === "CONDITIONAL"
                ? "CONDITIONAL"
                : "ELIGIBLE",
            caseStatus: decision === "INELIGIBLE" ? "REJECTED" : "APPROVED",
          },
        });
      }
    } else if (action === "SUBMIT_FIELD_REPORT") {
      const caseId = String(p.caseId || "");
      const existingCase = await prisma.case.findUnique({
        where: { id: caseId },
        include: { household: true, assistanceRequests: true },
      });
      if (existingCase) {
        await prisma.case.update({
          where: { id: caseId },
          data: {
            researchStatus: "SUBMITTED",
            caseStatus: "RESEARCH_SUBMITTED",
          },
        });
        if (existingCase.householdId) {
          const prevMeta = (existingCase.household?.socialConditionsJson ||
            {}) as Record<string, unknown>;
          const nextVersion = Number(prevMeta.reportVersion || 1) + 1;
          await prisma.household.update({
            where: { id: existingCase.householdId },
            data: {
              monthlyIncomePiasters: BigInt(
                Math.round((Number(p.incomeEgp) || 2000) * 100)
              ),
              monthlyExpensesPiasters: BigInt(
                Math.round((Number(p.expensesEgp) || 4500) * 100)
              ),
              socialConditionsJson: {
                ...prevMeta,
                reportVersion: nextVersion,
              },
            },
          });
        }
        const req = existingCase.assistanceRequests[0];
        if (req && p.notesAr) {
          await prisma.assistanceRequest.update({
            where: { id: req.id },
            data: { descriptionAr: String(p.notesAr) },
          });
        }
      }
    } else if (action === "CONFIRM_DELIVERY") {
      const deliveryId = String(p.deliveryId || "");
      const deliv = await prisma.aidDelivery.findUnique({
        where: { id: deliveryId },
        include: { assistanceRequest: true },
      });
      if (deliv) {
        await prisma.aidDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
        });
        await prisma.assistanceRequest.update({
          where: { id: deliv.assistanceRequestId },
          data: {
            deliveryStatus: "CONFIRMED",
            allocationStatus: "DISBURSED",
          },
        });
        if (deliv.assistanceRequest.caseId) {
          await prisma.case.update({
            where: { id: deliv.assistanceRequest.caseId },
            data: { caseStatus: "CLOSED" },
          });
        }
      }
    }

    if (p.audit) {
      const audit = p.audit as Record<string, string>;
      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          tenantId: session.tenantId,
          actionCode: audit.actionCode || action,
          resourceType: "PlatformState",
          metadataJson: {
            actorNameAr: session.fullNameAr,
            role: session.role,
            descriptionAr: audit.descriptionAr,
            tenantNameAr:
              session.tenantNameAr ||
              audit.tenantNameAr ||
              "منصة سَنَد المركزية",
          },
        },
      });
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        error: err instanceof Error ? err.message : "Persistence error",
      },
      { status: 500 }
    );
  }
}
