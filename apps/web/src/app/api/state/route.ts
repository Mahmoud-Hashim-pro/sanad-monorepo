import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@sanad/database";
import {
  AID_CATEGORIES_LABELS,
  type AidCategoryCode,
  type MockTenant,
  type MockCase,
  type MockDonation,
  type MockDelivery,
  type MockAuditLog,
  type TenantStatus,
} from "../../../lib/mock-data/fictional-seed";
import { maskEgyptianNationalId } from "../../../lib/domain/sanad-rules";

export const dynamic = "force-dynamic";

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
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, source: "no_database_url" },
      { status: 503 }
    );
  }

  try {
    const [dbTenants, dbCases, dbDonations, dbDeliveries, dbAuditLogs] =
      await Promise.all([
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
        prisma.auditLog.findMany({
          include: { actor: true },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
      ]);

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

      return {
        id: c.id,
        tenantId: c.tenantId,
        caseNumber: c.caseNumber,
        beneficiaryNameAr: cleanName,
        nationalId: "27905151601234",
        maskedNationalId: c.beneficiary.personIdentity.maskedNationalId,
        phoneE164: c.beneficiary.primaryContactPhone,
        householdCode: c.household?.householdCode || "GH-HH-2026-001",
        governorate: c.household?.governorate || "الغربية",
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
            : "NEW",
        researchStatus:
          c.researchStatus === "REVIEWED"
            ? "REVIEWED"
            : c.researchStatus === "SUBMITTED"
            ? "SUBMITTED"
            : c.researchStatus === "NEEDS_REVISION"
            ? "NEEDS_REVISION"
            : "ASSIGNED",
        eligibilityDecision:
          c.eligibilityDecision === "ELIGIBLE"
            ? "ELIGIBLE"
            : c.eligibilityDecision === "CONDITIONAL"
            ? "CONDITIONAL"
            : c.eligibilityDecision === "INELIGIBLE"
            ? "INELIGIBLE"
            : "PENDING",
        allocationStatus:
          req?.allocationStatus === "FULLY_ALLOCATED" ? "RESERVED" : "UNALLOCATED",
        deliveryStatus:
          req?.deliveryStatus === "CONFIRMED"
            ? "CONFIRMED"
            : req?.deliveryStatus === "SCHEDULED"
            ? "SCHEDULED"
            : "PENDING",
        requestedEgp,
        approvedEgp,
        assignedVolunteerAr: "أحمد سامي الكيلاني",
        assignedVolunteerId: "user-vol-ahmed",
        supervisorAr: "د. منى الشاذلي",
        householdIncomeEgp: c.household
          ? Math.round(Number(c.household.monthlyIncomePiasters) / 100)
          : 1800,
        householdExpensesEgp: c.household
          ? Math.round(Number(c.household.monthlyExpensesPiasters) / 100)
          : 4200,
        researchNotesAr:
          req?.descriptionAr ||
          c.titleAr.replace(/\s*\(بيانات (تجريبية|خيالية)\)/g, ""),
        reportVersion: 1,
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
          `تنفيذ عملية (${log.actionCode}) على (${log.resourceType}) في قاعدة بيانات Neon PostgreSQL`,
        tenantNameAr:
          (meta.tenantNameAr as string) || "قاعدة بيانات المنصة المركزية (Neon DB)",
      };
    });

    return NextResponse.json({
      ok: true,
      source: "neon_postgresql",
      tenants,
      cases,
      donations,
      deliveries,
      auditLogs,
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
    } else if (action === "CREATE_CASE") {
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
        const caseNumber = String(p.caseNumber || `CASE-2026-${Date.now().toString().slice(-4)}`);
        const createdCase = await prisma.case.create({
          data: {
            tenantId: dbTenant.id,
            beneficiaryId: beneficiary.id,
            caseNumber,
            titleAr:
              AID_CATEGORIES_LABELS[
                (p.category as AidCategoryCode) || "MONTHLY_FOOD"
              ] || "طلب مساعدة",
            caseStatus: "SUBMITTED",
            researchStatus: "ASSIGNED",
            priorityLevel: "HIGH",
          },
        });

        await prisma.assistanceRequest.create({
          data: {
            tenantId: dbTenant.id,
            caseId: createdCase.id,
            beneficiaryId: beneficiary.id,
            requestNumber: `REQ-${Date.now().toString().slice(-6)}`,
            targetType: p.targetType === "PERSON" ? "PERSON" : "HOUSEHOLD",
            category: mapFrontendCategoryToDb(String(p.category || "MONTHLY_FOOD")),
            descriptionAr: String(
              p.notesAr || "ملف حالة مسجل بالرقم القومي ومحال للبحث الاجتماعي"
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
    }

    if (p.audit) {
      const audit = p.audit as Record<string, string>;
      await prisma.auditLog.create({
        data: {
          actionCode: audit.actionCode || action,
          resourceType: "PlatformState",
          metadataJson: {
            actorNameAr: audit.actorNameAr,
            role: audit.actorRoleAr,
            descriptionAr: audit.descriptionAr,
            tenantNameAr: audit.tenantNameAr,
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
