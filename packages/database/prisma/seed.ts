/**
 * SANAD Fictional Database Seed Script (Sprint 1)
 * IMPORTANT: Contains strictly fictional Arabic test data. No real National IDs or real PII.
 * Idempotent via `upsert` with deterministic UUIDs and composite unique keys.
 */
import {
  PrismaClient,
  RoleCode,
  TenantType,
  TenantStatus,
  AccountStatus,
  CaseStatus,
  ResearchStatus,
  EligibilityDecisionType,
  AssistanceTargetType,
  AidCategory,
  DonationType,
  DonationStatus,
  AllocationStatus,
  DeliveryStatus,
} from "@prisma/client";

declare const process: { exit(code?: number): void };

const prisma = new PrismaClient();

const ROLE_PERMISSIONS_MATRIX: Record<RoleCode, string[]> = {
  SUPER_ADMIN: [
    "platform:tenants:approve",
    "platform:users:manage",
    "platform:reference_data:manage",
    "platform:audit:read",
    "platform:stats:read",
  ],
  TENANT_ADMIN: [
    "tenant:members:manage",
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  RESEARCH_SUPERVISOR: [
    "tenant:cases:read_assigned",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:cases:recommend_eligibility",
  ],
  VOLUNTEER: [
    "tenant:tasks:read_assigned",
    "tenant:research:submit_report",
    "tenant:attachments:upload_authorized",
    "tenant:deliveries:confirm_assigned",
  ],
  BENEFICIARY: [
    "portal:profile:manage_own",
    "portal:requests:create_own",
    "portal:requests:read_own",
    "portal:documents:upload_own",
    "portal:aid_history:read_own_verified",
    "portal:corrections:submit_own",
  ],
};

async function main() {
  console.log("بدء زراعة البيانات التجريبية الخيالية لمنصة سَنَد (SANAD Fictional Seed)...");

  // 1. Seed Roles
  const roles: { code: RoleCode; nameAr: string; descriptionAr: string }[] = [
    {
      code: RoleCode.SUPER_ADMIN,
      nameAr: "مدير المنصة",
      descriptionAr: "إدارة اعتماد الجهات وإعدادات المنصة والتدقيق العام",
    },
    {
      code: RoleCode.TENANT_ADMIN,
      nameAr: "مدير الجهة / المبادرة",
      descriptionAr: "إدارة المستفيدين والحالات والتبرعات والتخصيص والتسليم",
    },
    {
      code: RoleCode.RESEARCH_SUPERVISOR,
      nameAr: "مشرف البحث الاجتماعي",
      descriptionAr: "توزيع ومراجعة الأبحاث الميدانية وتوصيات الاستحقاق",
    },
    {
      code: RoleCode.VOLUNTEER,
      nameAr: "باحث / متطوع ميداني",
      descriptionAr: "تنفيذ الزيارات الميدانية وتوثيق تسليم المساعدات المسندة",
    },
    {
      code: RoleCode.BENEFICIARY,
      nameAr: "مستفيد",
      descriptionAr: "بوابة الخدمة الذاتية لتقديم الطلبات ومتابعة سجل المساعدات الموثق",
    },
  ];

  const roleMap = new Map<RoleCode, string>();
  for (const r of roles) {
    const savedRole = await prisma.role.upsert({
      where: { code: r.code },
      update: { nameAr: r.nameAr, descriptionAr: r.descriptionAr },
      create: r,
    });
    roleMap.set(r.code, savedRole.id);
  }

  // 2. Seed Permissions & RolePermissions from ROLE_PERMISSIONS_MATRIX
  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS_MATRIX) as [
    RoleCode,
    string[],
  ][]) {
    const roleId = roleMap.get(roleCode);
    if (!roleId) continue;

    for (const permCode of permissionCodes) {
      const [scope, moduleName] = permCode.split(":");
      const savedPerm = await prisma.permission.upsert({
        where: { code: permCode },
        update: {
          module: `${scope}:${moduleName}`,
          descriptionAr: `صلاحية ${permCode} لدور ${roleCode}`,
        },
        create: {
          code: permCode,
          module: `${scope}:${moduleName}`,
          descriptionAr: `صلاحية ${permCode} لدور ${roleCode}`,
        },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: savedPerm.id,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId: savedPerm.id,
        },
      });
    }
  }

  // 3. Seed Super Admin (eng.mhashim@gmail.com) & Fictional PersonIdentities / Users
  const superAdminIdentity = await prisma.personIdentity.upsert({
    where: { nationalIdHmac: "hmac_super_admin_eng_mhashim_29501010101234" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111100",
      nationalIdHmac: "hmac_super_admin_eng_mhashim_29501010101234",
      nationalIdEncrypted: "enc_v1_super_admin_29501010101234",
      maskedNationalId: "295010101****4",
      birthDate: new Date("1995-01-01T00:00:00.000Z"),
      governorateCode: "01",
      isVerified: true,
      verifiedAt: new Date("2026-01-01T09:00:00.000Z"),
    },
  });

  const superAdminUser = await prisma.user.upsert({
    where: { personIdentityId: superAdminIdentity.id },
    update: {
      fullNameAr: "م. محمود هاشم — مدير المنصة المركزي (eng.mhashim@gmail.com)",
      status: AccountStatus.ACTIVE,
    },
    create: {
      id: "22222222-2222-4222-8222-222222222200",
      personIdentityId: superAdminIdentity.id,
      fullNameAr: "م. محمود هاشم — مدير المنصة المركزي (eng.mhashim@gmail.com)",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$super_admin_eng_mhashim",
      status: AccountStatus.ACTIVE,
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "99999999-9999-4999-8999-999999999900" },
    update: {},
    create: {
      id: "99999999-9999-4999-8999-999999999900",
      actorUserId: superAdminUser.id,
      actionCode: "SUPER_ADMIN_ACCOUNT_PROVISIONED",
      resourceType: "User",
      resourceId: superAdminUser.id,
      metadataJson: {
        email: "eng.mhashim@gmail.com",
        role: "SUPER_ADMIN",
        fullNameAr: "م. محمود هاشم",
      },
    },
  });

  const gharbiaOwnerIdentity = await prisma.personIdentity.upsert({
    where: { nationalIdHmac: "hmac_fictional_gharbia_admin_28003101601118" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111101",
      nationalIdHmac: "hmac_fictional_gharbia_admin_28003101601118",
      nationalIdEncrypted: "enc_v1_fictional_28003101601118",
      maskedNationalId: "280031016****8",
      birthDate: new Date("1980-03-10T00:00:00.000Z"),
      governorateCode: "16",
      isVerified: true,
      verifiedAt: new Date("2026-01-10T10:00:00.000Z"),
    },
  });

  const dakahliaOwnerIdentity = await prisma.personIdentity.upsert({
    where: { nationalIdHmac: "hmac_fictional_dakahlia_owner_28807221202229" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111102",
      nationalIdHmac: "hmac_fictional_dakahlia_owner_28807221202229",
      nationalIdEncrypted: "enc_v1_fictional_28807221202229",
      maskedNationalId: "288072212****9",
      birthDate: new Date("1988-07-22T00:00:00.000Z"),
      governorateCode: "12",
      isVerified: true,
      verifiedAt: new Date("2026-01-12T10:00:00.000Z"),
    },
  });

  const beneficiaryIdentity = await prisma.personIdentity.upsert({
    where: { nationalIdHmac: "hmac_fictional_beneficiary_27905151601234" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111103",
      nationalIdHmac: "hmac_fictional_beneficiary_27905151601234",
      nationalIdEncrypted: "enc_v1_fictional_27905151601234",
      maskedNationalId: "279051516****4",
      birthDate: new Date("1979-05-15T00:00:00.000Z"),
      governorateCode: "16",
      isVerified: true,
      verifiedAt: new Date("2026-01-15T10:00:00.000Z"),
    },
  });

  const gharbiaOwnerUser = await prisma.user.upsert({
    where: { personIdentityId: gharbiaOwnerIdentity.id },
    update: { fullNameAr: "أحمد محمود الشناوي (بيانات تجريبية)" },
    create: {
      id: "22222222-2222-4222-8222-222222222201",
      personIdentityId: gharbiaOwnerIdentity.id,
      fullNameAr: "أحمد محمود الشناوي (بيانات تجريبية)",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fictional_hash_gharbia",
      status: AccountStatus.ACTIVE,
    },
  });

  const dakahliaOwnerUser = await prisma.user.upsert({
    where: { personIdentityId: dakahliaOwnerIdentity.id },
    update: { fullNameAr: "سارة عبد الرحمن المنصوري (بيانات تجريبية)" },
    create: {
      id: "22222222-2222-4222-8222-222222222202",
      personIdentityId: dakahliaOwnerIdentity.id,
      fullNameAr: "سارة عبد الرحمن المنصوري (بيانات تجريبية)",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fictional_hash_dakahlia",
      status: AccountStatus.ACTIVE,
    },
  });

  // 4. Seed UserPhone
  await prisma.userPhone.upsert({
    where: { id: "23333333-3333-4333-8333-333333333301" },
    update: {},
    create: {
      id: "23333333-3333-4333-8333-333333333301",
      userId: gharbiaOwnerUser.id,
      phoneE164: "+201011122233",
      isPrimaryLogin: true,
      isSharedContact: false,
      isVerified: true,
      verifiedAt: new Date("2026-01-10T10:05:00.000Z"),
    },
  });

  await prisma.userPhone.upsert({
    where: { id: "23333333-3333-4333-8333-333333333302" },
    update: {},
    create: {
      id: "23333333-3333-4333-8333-333333333302",
      userId: dakahliaOwnerUser.id,
      phoneE164: "+201122233344",
      isPrimaryLogin: true,
      isSharedContact: false,
      isVerified: true,
      verifiedAt: new Date("2026-01-12T10:05:00.000Z"),
    },
  });

  // 5. Seed Tenants (Gharbia Association & Dakahlia Individual Initiative)
  const gharbiaTenant = await prisma.tenant.upsert({
    where: { registrationNumber: "GHARBIA-ASSN-1842" },
    update: { status: TenantStatus.ACTIVE },
    create: {
      id: "33333333-3333-4333-8333-333333333301",
      type: TenantType.ASSOCIATION,
      nameAr: "جمعية النور للتكافل الاجتماعي بالغربية (بيانات تجريبية)",
      registrationNumber: "GHARBIA-ASSN-1842",
      governorate: "الغربية",
      ownerUserId: gharbiaOwnerUser.id,
      status: TenantStatus.ACTIVE,
      contactPhoneE164: "+201011122233",
      contactEmail: "nour.gharbia.demo@sanad.eg",
      addressAr: "طنطا - شارع البحر - محافظة الغربية",
      acceptsPublicRequests: true,
    },
  });

  const dakahliaTenant = await prisma.tenant.upsert({
    where: { id: "33333333-3333-4333-8333-333333333302" },
    update: {},
    create: {
      id: "33333333-3333-4333-8333-333333333302",
      type: TenantType.INDIVIDUAL,
      nameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري (بيانات تجريبية)",
      governorate: "الدقهلية",
      ownerUserId: dakahliaOwnerUser.id,
      status: TenantStatus.ACTIVE,
      contactPhoneE164: "+201122233344",
      contactEmail: "sara.dakahlia.demo@sanad.eg",
      addressAr: "المنصورة - حي الجامعة - محافظة الدقهلية",
      acceptsPublicRequests: true,
    },
  });

  // 6. Seed TenantMemberships
  const gharbiaMembership = await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: gharbiaTenant.id,
        userId: gharbiaOwnerUser.id,
      },
    },
    update: { isActive: true },
    create: {
      id: "44444444-4444-4444-8444-444444444401",
      tenantId: gharbiaTenant.id,
      userId: gharbiaOwnerUser.id,
      isActive: true,
    },
  });

  const tenantAdminRoleId = roleMap.get(RoleCode.TENANT_ADMIN);
  if (tenantAdminRoleId) {
    await prisma.membershipRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: gharbiaMembership.id,
          roleId: tenantAdminRoleId,
        },
      },
      update: {},
      create: {
        membershipId: gharbiaMembership.id,
        roleId: tenantAdminRoleId,
      },
    });
  }

  // 7. Seed Beneficiary, TenantBeneficiary, and Household
  const beneficiary = await prisma.beneficiary.upsert({
    where: { personIdentityId: beneficiaryIdentity.id },
    update: {},
    create: {
      id: "55555555-5555-4555-8555-555555555501",
      personIdentityId: beneficiaryIdentity.id,
      fullNameAr: "فاطمة عبد الفتاح السيد (بيانات تجريبية)",
      primaryContactPhone: "+201233344455",
      maritalStatusAr: "أرملة",
      occupationAr: "ربة منزل",
    },
  });

  await prisma.tenantBeneficiary.upsert({
    where: {
      tenantId_beneficiaryId: {
        tenantId: gharbiaTenant.id,
        beneficiaryId: beneficiary.id,
      },
    },
    update: {},
    create: {
      id: "56666666-6666-4666-8666-666666666601",
      tenantId: gharbiaTenant.id,
      beneficiaryId: beneficiary.id,
      fileCode: "GH-BEN-2026-001",
      status: "ACTIVE",
      registeredById: gharbiaOwnerUser.id,
    },
  });

  const household = await prisma.household.upsert({
    where: {
      tenantId_householdCode: {
        tenantId: gharbiaTenant.id,
        householdCode: "GH-HH-2026-001",
      },
    },
    update: {},
    create: {
      id: "66666666-6666-4666-8666-666666666601",
      tenantId: gharbiaTenant.id,
      householdCode: "GH-HH-2026-001",
      governorate: "الغربية",
      cityOrCenterAr: "مركز طنطا",
      addressDetailsAr: "قرية ميت حبيش البحرية - بجوار المسجد الكبير (عنوان تجريبي)",
      primaryContactPhone: "+201233344455",
      monthlyIncomePiasters: 180000n,
      monthlyExpensesPiasters: 420000n,
      housingConditionAr: "إيجار قديم بحاجة لترميم سقف",
    },
  });

  // 8. Seed Case & AssistanceRequest
  const socialCase = await prisma.case.upsert({
    where: {
      tenantId_caseNumber: {
        tenantId: gharbiaTenant.id,
        caseNumber: "CASE-2026-1042",
      },
    },
    update: {},
    create: {
      id: "77777777-7777-4777-8777-777777777701",
      tenantId: gharbiaTenant.id,
      beneficiaryId: beneficiary.id,
      householdId: household.id,
      caseNumber: "CASE-2026-1042",
      titleAr: "دعم علاجي وإعاشة شهرية لأسرة معيلة (بيانات تجريبية)",
      caseStatus: CaseStatus.APPROVED,
      researchStatus: ResearchStatus.REVIEWED,
      eligibilityDecision: EligibilityDecisionType.ELIGIBLE,
      priorityLevel: "HIGH",
    },
  });

  const assistanceRequest = await prisma.assistanceRequest.upsert({
    where: {
      tenantId_requestNumber: {
        tenantId: gharbiaTenant.id,
        requestNumber: "REQ-2026-5001",
      },
    },
    update: {},
    create: {
      id: "88888888-8888-4888-8888-888888888801",
      tenantId: gharbiaTenant.id,
      caseId: socialCase.id,
      beneficiaryId: beneficiary.id,
      householdId: household.id,
      requestNumber: "REQ-2026-5001",
      targetType: AssistanceTargetType.HOUSEHOLD,
      category: AidCategory.MEDICAL_AID,
      descriptionAr: "توفير علاج شهري ومستلزمات طبية عاجلة للأسرة",
      requestedAmountPiasters: 250000n,
      approvedAmountPiasters: 250000n,
      status: "APPROVED",
      allocationStatus: "FULLY_ALLOCATED",
      deliveryStatus: "CONFIRMED",
    },
  });

  // 9. Seed Donor, Donation, Allocation, AidDelivery, and AuditLog
  const donor = await prisma.donor.upsert({
    where: { id: "99999999-9999-4999-8999-999999999901" },
    update: {},
    create: {
      id: "99999999-9999-4999-8999-999999999901",
      donorType: "INDIVIDUAL",
      fullNameAr: "المهندس طارق عبد العزيز (متبرع تجريبي)",
      phoneE164: "+201555566677",
      email: "tarek.donor.demo@sanad.eg",
    },
  });

  const donation = await prisma.donation.upsert({
    where: {
      tenantId_receiptNumber: {
        tenantId: gharbiaTenant.id,
        receiptNumber: "DON-2026-9001",
      },
    },
    update: {},
    create: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
      tenantId: gharbiaTenant.id,
      donorId: donor.id,
      receiptNumber: "DON-2026-9001",
      donationType: DonationType.MONETARY,
      status: DonationStatus.PARTIALLY_ALLOCATED,
      restrictedCategory: AidCategory.MEDICAL_AID,
      totalAmountPiasters: 1000000n,
      reservedAmountPiasters: 0n,
      deliveredAmountPiasters: 250000n,
      availableAmountPiasters: 750000n,
      confirmedAt: new Date("2026-02-01T12:00:00.000Z"),
      confirmedByUserId: gharbiaOwnerUser.id,
      notesAr: "تبرع نقدي مخصص لدعم الحالات الطبية الحرجة",
    },
  });

  const allocation = await prisma.allocation.upsert({
    where: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01" },
    update: {},
    create: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01",
      tenantId: gharbiaTenant.id,
      donationId: donation.id,
      assistanceRequestId: assistanceRequest.id,
      status: AllocationStatus.DELIVERED,
      allocatedAmountPiasters: 250000n,
      createdByUserId: gharbiaOwnerUser.id,
    },
  });

  await prisma.aidDelivery.upsert({
    where: { idempotencyKey: "seed-delivery-idem-2026-0001" },
    update: {},
    create: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccc01",
      tenantId: gharbiaTenant.id,
      allocationId: allocation.id,
      assistanceRequestId: assistanceRequest.id,
      beneficiaryId: beneficiary.id,
      householdId: household.id,
      targetType: AssistanceTargetType.HOUSEHOLD,
      status: DeliveryStatus.CONFIRMED,
      deliveredAmountPiasters: 250000n,
      unitAr: "جنيه مصري",
      authorizedDescriptionAr: "صرف مساعدة علاجية معتمدة للأسرة بقيمة 2,500 ج.م",
      scheduledAt: new Date("2026-02-04T10:00:00.000Z"),
      confirmedAt: new Date("2026-02-05T14:30:00.000Z"),
      idempotencyKey: "seed-delivery-idem-2026-0001",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddd01" },
    update: {},
    create: {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddd01",
      tenantId: gharbiaTenant.id,
      actorUserId: gharbiaOwnerUser.id,
      actionCode: "DELIVERY_CONFIRMED",
      resourceType: "AidDelivery",
      resourceId: "cccccccc-cccc-4ccc-8ccc-cccccccccc01",
      ipAddress: "127.0.0.1",
      metadataJson: {
        caseNumber: socialCase.caseNumber,
        amountEgp: 2500,
        secondTenantSeeded: dakahliaTenant.nameAr,
      },
    },
  });

  console.log("تم زراعة الأدوار والصلاحيات والجهات والحالات والتبرعات التجريبية بنجاح.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
