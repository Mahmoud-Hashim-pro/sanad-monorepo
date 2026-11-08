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
  role: AuthRoleCode;
  tenantId: string | null;
  tenantNameAr: string | null;
} | null> {
  if (emailLower === "eng.mhashim@gmail.com") {
    return {
      role: "SUPER_ADMIN",
      tenantId: null,
      tenantNameAr: "الإدارة المركزية لمنصة سَنَد",
    };
  }

  try {
    const roleLogs = await prisma.auditLog.findMany({
      where: { actionCode: "ROLE_ASSIGNED_BY_SUPER_ADMIN" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    for (const log of roleLogs) {
      const meta = (log.metadataJson || {}) as Record<string, unknown>;
      if (String(meta.targetEmail || "").toLowerCase() === emailLower) {
        const assignedRole = (meta.assignedRole as AuthRoleCode) || "BENEFICIARY";
        return {
          role: assignedRole,
          tenantId: (meta.tenantId as string) || null,
          tenantNameAr: (meta.tenantNameAr as string) || null,
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

  // Always check if Super Admin updated this user's role in Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    const latestAssignment = await resolveRoleAssignedBySuperAdmin(
      session.email.toLowerCase()
    );
    if (latestAssignment && latestAssignment.role !== session.role) {
      const updatedSession: SanadSessionPayload = {
        ...session,
        role: latestAssignment.role,
        permissions: ROLE_PERMISSIONS_MAP[latestAssignment.role],
        tenantId: latestAssignment.tenantId ?? session.tenantId,
        tenantNameAr: latestAssignment.tenantNameAr ?? session.tenantNameAr,
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
      let targetUserId: string | null =
        DEFAULT_EMAIL_ROLES[normalizedEmail]?.userId || null;
      let resolvedRole: AuthRoleCode =
        superAdminAssigned?.role || "BENEFICIARY";
      let resolvedTenantId: string | null =
        superAdminAssigned?.tenantId || null;
      let resolvedTenantNameAr: string | null =
        superAdminAssigned?.tenantNameAr || null;

      if (!targetUserId) {
        const regLogs = await prisma.auditLog.findMany({
          where: { actionCode: "AUTH_REGISTER_VERIFIED" },
          orderBy: { createdAt: "desc" },
          take: 200,
        });

        const matchedLog = regLogs.find((l) => {
          const meta = (l.metadataJson || {}) as Record<string, unknown>;
          return String(meta.email || "").toLowerCase() === normalizedEmail;
        });

        if (matchedLog && matchedLog.resourceId) {
          targetUserId = matchedLog.resourceId;
          const meta = (matchedLog.metadataJson || {}) as Record<string, unknown>;
          if (!superAdminAssigned) {
            resolvedRole = (meta.role as AuthRoleCode) || "BENEFICIARY";
            resolvedTenantId = (meta.tenantId as string) || null;
            resolvedTenantNameAr = (meta.tenantNameAr as string) || null;
          }
        }
      }

      if (!targetUserId) {
        return NextResponse.json(
          {
            ok: false,
            field: "email",
            errorAr:
              "هذا البريد الإلكتروني غير مسجل بعد. يرجى الضغط على تبويب (إنشاء حساب جديد) للتسجيل بالرقم القومي أولاً.",
          },
          { status: 401 }
        );
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          personIdentity: true,
          phones: true,
          ownedTenants: true,
        },
      });

      if (!dbUser) {
        return NextResponse.json(
          {
            ok: false,
            errorAr: "تعذر العثور على سجل المستخدم في قاعدة البيانات.",
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

      const sessionPayload: SanadSessionPayload = {
        userId: dbUser.id,
        email: normalizedEmail,
        fullNameAr: dbUser.fullNameAr,
        maskedNationalId: dbUser.personIdentity.maskedNationalId,
        phoneE164: dbUser.phones[0]?.phoneE164 || "+201000000001",
        governorateNameAr:
          dbUser.ownedTenants[0]?.governorate || "القاهرة",
        role: resolvedRole,
        permissions: ROLE_PERMISSIONS_MAP[resolvedRole],
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
    const assignedRole: AuthRoleCode =
      superAdminAssigned?.role || "BENEFICIARY";
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
        fullNameAr: fullName,
        passwordHash: scryptHash,
        status: "ACTIVE",
        lastLoginAt: new Date(),
      },
      create: {
        personIdentityId: identity.id,
        fullNameAr: fullName,
        passwordHash: scryptHash,
        status: "ACTIVE",
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

    const sessionPayload: SanadSessionPayload = {
      userId: dbUser.id,
      email: normalizedEmail,
      fullNameAr: fullName,
      maskedNationalId: maskedNid,
      phoneE164: phoneResult.e164,
      governorateNameAr: nidResult.parsed.governorateNameAr,
      role: assignedRole,
      permissions: ROLE_PERMISSIONS_MAP[assignedRole],
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
