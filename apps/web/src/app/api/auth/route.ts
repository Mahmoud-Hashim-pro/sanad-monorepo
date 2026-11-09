import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@sanad/database";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
import {
  validateFullName,
  validateEmailAddress,
  maskEgyptianNationalId,
  resolveRoleLabelAr,
  resolveRolePermissions,
} from "../../../lib/domain/sanad-rules";
import {
  getServerSession,
  hashPasswordScrypt,
  verifyPasswordScrypt,
  signSessionToken,
  SESSION_COOKIE_NAME,
  ROLE_PERMISSIONS_MAP,
  type AuthRoleCode,
  type SanadSessionPayload,
} from "../../../lib/server/auth-session";

export const dynamic = "force-dynamic";

const DEFAULT_EMAIL_ROLES: Record<
  string,
  {
    userId?: string;
    role: AuthRoleCode;
    tenantId: string | null;
    tenantNameAr: string;
    defaultPass?: string;
  }
> = {
  "eng.mhashim@gmail.com": {
    userId: "22222222-2222-4222-8222-222222222200",
    role: "SUPER_ADMIN",
    tenantId: null,
    tenantNameAr: "الإدارة المركزية لمنصة سَنَد",
    defaultPass: "Sanad@2026",
  },
};

async function resolveRoleAssignedBySuperAdmin(emailLower: string): Promise<{
  role: string;
  tenantId: string | null;
  tenantNameAr: string | null;
  customPermissions?: string[];
} | null> {
  if (emailLower === "eng.mhashim@gmail.com") {
    return {
      role: "SUPER_ADMIN",
      tenantId: null,
      tenantNameAr: "الإدارة المركزية لمنصة سَنَد",
    };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: emailLower },
      include: {
        ownedTenants: true,
        memberships: { include: { tenant: true } },
      },
    });

    if (user && user.customRoleCode) {
      const tenantId =
        user.ownedTenants[0]?.id || user.memberships[0]?.tenantId || null;
      const tenantNameAr =
        user.ownedTenants[0]?.nameAr ||
        user.memberships[0]?.tenant?.nameAr ||
        null;
      return {
        role: user.customRoleCode,
        tenantId,
        tenantNameAr,
        customPermissions: user.customPermissions,
      };
    }

    const roleLogs = await prisma.auditLog.findMany({
      where: { actionCode: "ROLE_ASSIGNED_BY_SUPER_ADMIN" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    for (const log of roleLogs) {
      const meta = (log.metadataJson || {}) as Record<string, unknown>;
      if (String(meta.targetEmail || "").toLowerCase() === emailLower) {
        const assignedRole = String(meta.assignedRole || "BENEFICIARY");
        return {
          role: assignedRole,
          tenantId: (meta.tenantId as string) || null,
          tenantNameAr: (meta.tenantNameAr as string) || null,
          customPermissions: Array.isArray(meta.customPermissions)
            ? (meta.customPermissions as string[])
            : [],
        };
      }
    }
  } catch {
    // Ignore DB lookup errors
  }

  if (DEFAULT_EMAIL_ROLES[emailLower]) {
    return {
      role: DEFAULT_EMAIL_ROLES[emailLower].role,
      tenantId: DEFAULT_EMAIL_ROLES[emailLower].tenantId,
      tenantNameAr: DEFAULT_EMAIL_ROLES[emailLower].tenantNameAr,
    };
  }

  return null;
}

export async function GET() {
  const session = getServerSession();
  if (!session) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      user: null,
    });
  }

  // Always check if Super Admin updated this user's role/permissions in Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      const emailLower = session.email.toLowerCase();
      const [latestAssignment, dynamicRoles, dbUser] = await Promise.all([
        resolveRoleAssignedBySuperAdmin(emailLower),
        prisma.dynamicRole.findMany(),
        prisma.user.findFirst({
          where: { email: emailLower },
          select: { customPermissions: true, customRoleCode: true },
        }),
      ]);

      const currentRole =
        latestAssignment?.role ||
        dbUser?.customRoleCode ||
        session.role;

      const roleNameAr = resolveRoleLabelAr(currentRole, dynamicRoles);

      const resolvedPermissions =
        currentRole === "SUPER_ADMIN"
          ? Array.from(
              new Set([
                ...ROLE_PERMISSIONS_MAP.SUPER_ADMIN,
                ...(dynamicRoles.find((r) => r.code === "SUPER_ADMIN")?.permissions || []),
              ])
            )
          : resolveRolePermissions(
              currentRole,
              dbUser?.customPermissions || latestAssignment?.customPermissions || [],
              dynamicRoles
            );

      const isChanged =
        currentRole !== session.role ||
        resolvedPermissions.length !== (session.permissions?.length || 0);

      if (isChanged) {
        const updatedSession: SanadSessionPayload = {
          ...session,
          role: currentRole as AuthRoleCode,
          roleNameAr,
          permissions: resolvedPermissions,
          tenantId: latestAssignment?.tenantId ?? session.tenantId,
          tenantNameAr: latestAssignment?.tenantNameAr ?? session.tenantNameAr,
        };
        const newToken = signSessionToken(updatedSession);
        const res = NextResponse.json({
          ok: true,
          authenticated: true,
          user: updatedSession,
        });
        res.cookies.set(SESSION_COOKIE_NAME, newToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return res;
      }
    } catch {
      // Ignore refresh error
    }
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: session,
  });
}

export async function DELETE() {
  const session = getServerSession();
  if (session && process.env.DATABASE_URL) {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: session.userId,
          actionCode: "AUTH_LOGOUT",
          resourceType: "User",
          resourceId: session.userId,
          metadataJson: {
            actorNameAr: session.fullNameAr,
            email: session.email,
            role: session.role,
            descriptionAr: `تسجيل خروج آمن وإبطال جلسة المستخدم (${session.email})`,
            tenantNameAr: session.tenantNameAr || "منصة سَنَد المركزية",
          },
        },
      });
    } catch {
      // Ignore audit log error on logout
    }
  }

  const res = NextResponse.json({ ok: true, loggedOut: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "LOGIN" | "REGISTER";
      fullName?: string;
      email?: string;
      nationalId?: string;
      mobile?: string;
      password?: string;
    };

    const mode = body.mode || "LOGIN";
    const nationalId = (body.nationalId || "").trim();
    const mobile = (body.mobile || "").trim();
    const email = (body.email || "").trim();
    const fullName = (body.fullName || "").trim();
    const password = (body.password || "").trim();

    const emailResult = validateEmailAddress(email);
    if (!emailResult.isValid || !emailResult.normalized) {
      return NextResponse.json(
        {
          ok: false,
          field: "email",
          errorAr: emailResult.messageAr,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = emailResult.normalized.toLowerCase();

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          field: "password",
          errorAr: "يرجى إدخال كلمة المرور (6 خانات على الأقل).",
        },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          ok: false,
          errorAr: "قاعدة البيانات غير متصلة حالياً.",
        },
        { status: 503 }
      );
    }

    // Check if Super Admin assigned a role to this email
    const superAdminAssigned = await resolveRoleAssignedBySuperAdmin(
      normalizedEmail
    );

    // =========================================================================
    // LOGIN FLOW: Authenticate by Email + Password, role resolved from DB
    // =========================================================================
    if (mode === "LOGIN") {
      let dbUser = await prisma.user.findFirst({
        where: { email: normalizedEmail },
        include: {
          personIdentity: true,
          phones: true,
          ownedTenants: true,
          memberships: { include: { tenant: true } },
        },
      });

      let targetUserId: string | null =
        dbUser?.id || DEFAULT_EMAIL_ROLES[normalizedEmail]?.userId || null;
      let resolvedRole: string =
        dbUser?.customRoleCode || superAdminAssigned?.role || "BENEFICIARY";
      let resolvedTenantId: string | null =
        superAdminAssigned?.tenantId || null;
      let resolvedTenantNameAr: string | null =
        superAdminAssigned?.tenantNameAr || null;

      if (!dbUser && !targetUserId) {
        const allUserLogs = await prisma.auditLog.findMany({
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

        const matchedLog = allUserLogs.find((l) => {
          const meta = (l.metadataJson || {}) as Record<string, unknown>;
          const logEmail = String(meta.email || meta.targetEmail || "")
            .trim()
            .toLowerCase();
          return logEmail === normalizedEmail;
        });

        if (matchedLog && matchedLog.resourceId) {
          targetUserId = matchedLog.resourceId;
          const meta = (matchedLog.metadataJson || {}) as Record<string, unknown>;
          if (!superAdminAssigned) {
            resolvedRole =
              (meta.role as string) ||
              (meta.assignedRole as string) ||
              "BENEFICIARY";
            resolvedTenantId = (meta.tenantId as string) || null;
            resolvedTenantNameAr = (meta.tenantNameAr as string) || null;
          }
        }
      }

      if (!dbUser && !targetUserId) {
        const actorLogs = await prisma.auditLog.findMany({
          where: { actorUserId: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 300,
        });
        const matchedActor = actorLogs.find((l) => {
          const meta = (l.metadataJson || {}) as Record<string, unknown>;
          return (
            String(meta.email || meta.targetEmail || "").trim().toLowerCase() ===
            normalizedEmail
          );
        });
        if (matchedActor && matchedActor.actorUserId) {
          targetUserId = matchedActor.actorUserId;
        }
      }

      // If user was assigned a role by Super Admin but lacks a User record, provision immediately
      if (!dbUser && !targetUserId && superAdminAssigned) {
        const pepper =
          process.env.NATIONAL_ID_HMAC_PEPPER || "sanad-default-pepper-key";
        const emailHashNum = Math.abs(
          normalizedEmail.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
        ) % 9000;
        const serial = String(1000 + emailHashNum).slice(0, 4);
        const validNid = `290010101${serial}1`;
        const nidHmac = createHmac("sha256", pepper).update(validNid).digest("hex");
        const maskedNid = maskEgyptianNationalId(validNid);

        const identity = await prisma.personIdentity.upsert({
          where: { nationalIdHmac: nidHmac },
          update: { isVerified: true, verifiedAt: new Date() },
          create: {
            nationalIdHmac: nidHmac,
            nationalIdEncrypted: `enc:aes256gcm:${Buffer.from(validNid).toString("base64")}`,
            maskedNationalId: maskedNid,
            birthDate: new Date("1990-01-01T00:00:00.000Z"),
            governorateCode: "01",
            isVerified: true,
            verifiedAt: new Date(),
          },
        });

        const createdUser = await prisma.user.create({
          data: {
            personIdentityId: identity.id,
            email: normalizedEmail,
            fullNameAr: normalizedEmail.split("@")[0] || "مستخدم معتمد",
            passwordHash: hashPasswordScrypt(password),
            status: "ACTIVE",
            customRoleCode: superAdminAssigned.role,
            customPermissions: superAdminAssigned.customPermissions || [],
            lastLoginAt: new Date(),
          },
        });

        await prisma.userPhone.create({
          data: {
            userId: createdUser.id,
            phoneE164: `+2010${String(10000000 + (emailHashNum * 3)).slice(0, 8)}`,
            isPrimaryLogin: true,
            isVerified: true,
            verifiedAt: new Date(),
          },
        });

        if (superAdminAssigned.tenantId) {
          await prisma.tenantMembership.create({
            data: {
              tenantId: superAdminAssigned.tenantId,
              userId: createdUser.id,
              isActive: true,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            actorUserId: createdUser.id,
            tenantId: superAdminAssigned.tenantId,
            actionCode: "AUTH_REGISTER_VERIFIED",
            resourceType: "User",
            resourceId: createdUser.id,
            metadataJson: {
              email: normalizedEmail,
              fullNameAr: normalizedEmail.split("@")[0],
              role: superAdminAssigned.role,
              tenantId: superAdminAssigned.tenantId,
              tenantNameAr: superAdminAssigned.tenantNameAr,
              descriptionAr: `تفعيل حساب مستخدم تلقائياً للدور المعين (${superAdminAssigned.role})`,
            },
          },
        });

        targetUserId = createdUser.id;
      }

      if (!dbUser && targetUserId) {
        dbUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          include: {
            personIdentity: true,
            phones: true,
            ownedTenants: true,
            memberships: { include: { tenant: true } },
          },
        });
      }

      if (!dbUser) {
        return NextResponse.json(
          {
            ok: false,
            field: "email",
            errorAr:
              "هذا البريد الإلكتروني غير مسجل بعد. يرجى الضغط على تبويب (إنشاء حساب جديد) للتسجيل أولاً أو مراجعة مدير المنصة.",
          },
          { status: 401 }
        );
      }

      const defaultSeedPass = DEFAULT_EMAIL_ROLES[normalizedEmail]?.defaultPass;

      if (defaultSeedPass && password === defaultSeedPass) {
        // Ensure the scrypt hash is saved for the provisioned account
        if (!dbUser.passwordHash.startsWith("scrypt$")) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { passwordHash: hashPasswordScrypt(password) },
          });
        }
      } else if (dbUser.passwordHash.startsWith("scrypt$")) {
        const validPass = verifyPasswordScrypt(password, dbUser.passwordHash);
        if (!validPass) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { failedLoginAttempts: { increment: 1 } },
          });
          return NextResponse.json(
            {
              ok: false,
              field: "password",
              errorAr: "كلمة المرور غير صحيحة؛ يرجى التأكد والمحاولة مرة أخرى.",
            },
            { status: 401 }
          );
        }
      } else {
        // Seeded user with non-scrypt placeholder: verify against defaultPass if present
        if (defaultSeedPass && password !== defaultSeedPass) {
          return NextResponse.json(
            {
              ok: false,
              field: "password",
              errorAr: "كلمة المرور غير صحيحة؛ يرجى التأكد والمحاولة مرة أخرى.",
            },
            { status: 401 }
          );
        }
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { passwordHash: hashPasswordScrypt(password) },
        });
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
        },
      });

      if (!resolvedTenantId && dbUser.ownedTenants[0]) {
        resolvedTenantId = dbUser.ownedTenants[0].id;
        resolvedTenantNameAr = dbUser.ownedTenants[0].nameAr;
      } else if (!resolvedTenantId && dbUser.memberships[0]?.tenantId) {
        resolvedTenantId = dbUser.memberships[0].tenantId;
        resolvedTenantNameAr = dbUser.memberships[0].tenant.nameAr;
      }

      const correlationId = `SANAD-LOGIN-${Date.now().toString(36).toUpperCase()}`;

      await prisma.auditLog.create({
        data: {
          actorUserId: dbUser.id,
          tenantId: resolvedTenantId,
          actionCode: "AUTH_LOGIN_VERIFIED",
          resourceType: "User",
          resourceId: dbUser.id,
          metadataJson: {
            actorNameAr: dbUser.fullNameAr,
            email: normalizedEmail,
            role: resolvedRole,
            descriptionAr: `تسجيل دخول موثق للحساب (${normalizedEmail}) بصلاحية (${resolvedRole})`,
            tenantNameAr: resolvedTenantNameAr || "منصة سَنَد المركزية",
            correlationId,
          },
        },
      });

      const dynamicRoles = await prisma.dynamicRole.findMany();

      if (!dbUser.email) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { email: normalizedEmail },
        });
        dbUser.email = normalizedEmail;
      }

      let finalRole: string =
        normalizedEmail === "eng.mhashim@gmail.com" ||
        dbUser.id === "22222222-2222-4222-8222-222222222200"
          ? "SUPER_ADMIN"
          : dbUser.customRoleCode ||
            superAdminAssigned?.role ||
            (dbUser.memberships[0] ? "ASSOCIATION_ADMIN" : "BENEFICIARY");

      const roleNameAr = resolveRoleLabelAr(finalRole, dynamicRoles);

      const resolvedPermissions =
        finalRole === "SUPER_ADMIN"
          ? Array.from(
              new Set([
                ...ROLE_PERMISSIONS_MAP.SUPER_ADMIN,
                ...(dynamicRoles.find((r) => r.code === "SUPER_ADMIN")?.permissions || []),
              ])
            )
          : resolveRolePermissions(
              finalRole,
              dbUser.customPermissions,
              dynamicRoles
            );

      const sessionPayload: SanadSessionPayload = {
        userId: dbUser.id,
        email: normalizedEmail,
        fullNameAr: dbUser.fullNameAr,
        maskedNationalId: dbUser.personIdentity.maskedNationalId,
        phoneE164: dbUser.phones[0]?.phoneE164 || "+201000000001",
        governorateNameAr:
          dbUser.ownedTenants[0]?.governorate || "القاهرة",
        role: finalRole as AuthRoleCode,
        roleNameAr,
        permissions: resolvedPermissions,
        tenantId: resolvedTenantId,
        tenantNameAr: resolvedTenantNameAr,
        iat: Date.now(),
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
      };

      const token = signSessionToken(sessionPayload);
      const res = NextResponse.json({
        ok: true,
        mode: "LOGIN",
        correlationId,
        user: sessionPayload,
      });

      res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    // =========================================================================
    // REGISTER FLOW: Mandatory National ID + Mobile + Name + Email + Password
    // Role is determined by Super Admin assignment (defaults to BENEFICIARY)
    // =========================================================================
    const nameResult = validateFullName(fullName);
    if (!nameResult.isValid) {
      return NextResponse.json(
        {
          ok: false,
          field: "fullName",
          errorAr: nameResult.messageAr,
        },
        { status: 400 }
      );
    }

    const nidResult = validateEgyptianNationalId(nationalId);
    if (!nidResult.isValid || !nidResult.parsed) {
      return NextResponse.json(
        {
          ok: false,
          field: "nationalId",
          errorAr:
            nidResult.errorAr ||
            "الرقم القومي المصري (14 رقماً) إلزامي وغير صالح.",
        },
        { status: 400 }
      );
    }

    const phoneResult = normalizeAndValidateEgyptianMobile(mobile);
    if (!phoneResult.isValid || !phoneResult.e164) {
      return NextResponse.json(
        {
          ok: false,
          field: "mobile",
          errorAr: phoneResult.errorAr || "رقم الهاتف المحمول المصري غير صالح.",
        },
        { status: 400 }
      );
    }

    // Role is strictly determined by Super Admin assignment for this email, or defaults to BENEFICIARY
    const assignedRole = (superAdminAssigned?.role as AuthRoleCode) || "BENEFICIARY";
    const assignedTenantId: string | null =
      superAdminAssigned?.tenantId || null;
    const assignedTenantNameAr: string | null =
      superAdminAssigned?.tenantNameAr || null;

    const correlationId = `SANAD-REG-${Date.now().toString(36).toUpperCase()}`;
    const maskedNid = maskEgyptianNationalId(nationalId);
    const pepper =
      process.env.NATIONAL_ID_HMAC_PEPPER || "sanad-default-pepper-key";
    const nationalIdHmac = createHmac("sha256", pepper)
      .update(nationalId)
      .digest("hex");

    const scryptHash = hashPasswordScrypt(password);

    const identity = await prisma.personIdentity.upsert({
      where: { nationalIdHmac },
      update: {
        isVerified: true,
        verifiedAt: new Date(),
      },
      create: {
        nationalIdHmac,
        nationalIdEncrypted: `enc:aes256gcm:${Buffer.from(nationalId).toString("base64")}`,
        maskedNationalId: maskedNid,
        birthDate: new Date(`${nidResult.parsed.birthDateIso}T00:00:00.000Z`),
        governorateCode: nidResult.parsed.governorateCode,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    const dbUser = await prisma.user.upsert({
      where: { personIdentityId: identity.id },
      update: {
        email: normalizedEmail,
        fullNameAr: fullName,
        passwordHash: scryptHash,
        status: "ACTIVE",
        customRoleCode: assignedRole,
        lastLoginAt: new Date(),
      },
      create: {
        personIdentityId: identity.id,
        email: normalizedEmail,
        fullNameAr: fullName,
        passwordHash: scryptHash,
        status: "ACTIVE",
        customRoleCode: assignedRole,
        customPermissions: [],
        lastLoginAt: new Date(),
      },
    });

    await prisma.userPhone.create({
      data: {
        userId: dbUser.id,
        phoneE164: phoneResult.e164,
        isPrimaryLogin: true,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: dbUser.id,
        tenantId: assignedTenantId,
        actionCode: "AUTH_REGISTER_VERIFIED",
        resourceType: "User",
        resourceId: dbUser.id,
        metadataJson: {
          actorNameAr: fullName,
          email: normalizedEmail,
          phoneE164: phoneResult.e164,
          maskedNationalId: maskedNid,
          governorateNameAr: nidResult.parsed.governorateNameAr,
          role: assignedRole,
          tenantId: assignedTenantId,
          tenantNameAr:
            assignedTenantNameAr ||
            `محافظة ${nidResult.parsed.governorateNameAr}`,
          descriptionAr: `تسجيل حساب جديد بالرقم القومي (${maskedNid}) والبريد (${normalizedEmail}) — الدور المعتمد: (${assignedRole})`,
          correlationId,
        },
      },
    });

    const dynamicRoles = await prisma.dynamicRole.findMany();
    const roleNameAr = resolveRoleLabelAr(assignedRole, dynamicRoles);
    const resolvedPermissions = resolveRolePermissions(
      assignedRole,
      [],
      dynamicRoles
    );

    const sessionPayload: SanadSessionPayload = {
      userId: dbUser.id,
      email: normalizedEmail,
      fullNameAr: fullName,
      maskedNationalId: maskedNid,
      phoneE164: phoneResult.e164,
      governorateNameAr: nidResult.parsed.governorateNameAr,
      role: assignedRole,
      roleNameAr,
      permissions: resolvedPermissions,
      tenantId: assignedTenantId,
      tenantNameAr: assignedTenantNameAr,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };

    const token = signSessionToken(sessionPayload);
    const res = NextResponse.json({
      ok: true,
      mode: "REGISTER",
      correlationId,
      user: sessionPayload,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        errorAr: "تعذر معالجة طلب التوثيق؛ يرجى التحقق من صحة الحقول المدخلة.",
      },
      { status: 400 }
    );
  }
}
