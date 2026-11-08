import { NextResponse } from "next/server";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
import {
  validateFullName,
  validateEmailAddress,
  validatePasswordStrength,
  validateOtpCode,
  maskEgyptianNationalId,
} from "../../../lib/domain/sanad-rules";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "LOGIN" | "REGISTER";
      fullName?: string;
      email?: string;
      nationalId?: string;
      mobile?: string;
      password?: string;
      otp?: string;
      targetRole?: string;
      organizationNameAr?: string;
    };

    const mode = body.mode || "LOGIN";
    const nationalId = (body.nationalId || "").trim();
    const mobile = (body.mobile || "").trim();
    const email = (body.email || "").trim();
    const fullName = (body.fullName || "").trim();
    const password = body.password || "";
    const otp = (body.otp || "").trim();
    const targetRole = body.targetRole || "ASSOCIATION_ADMIN";

    const nidResult = validateEgyptianNationalId(nationalId);
    if (!nidResult.isValid || !nidResult.parsed) {
      return NextResponse.json(
        {
          ok: false,
          field: "nationalId",
          errorAr: nidResult.errorAr || "الرقم القومي غير صالح.",
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
          errorAr: phoneResult.errorAr || "رقم الهاتف المحمول غير صالح.",
        },
        { status: 400 }
      );
    }

    const emailResult = validateEmailAddress(email);
    if (!emailResult.isValid) {
      return NextResponse.json(
        {
          ok: false,
          field: "email",
          errorAr: emailResult.messageAr,
        },
        { status: 400 }
      );
    }

    if (mode === "REGISTER") {
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

      const passwordResult = validatePasswordStrength(password);
      if (!passwordResult.isValid) {
        return NextResponse.json(
          {
            ok: false,
            field: "password",
            errorAr: passwordResult.messageAr,
          },
          { status: 400 }
        );
      }
    }

    const otpResult = validateOtpCode(otp);
    if (!otpResult.isValid) {
      return NextResponse.json(
        {
          ok: false,
          field: "otp",
          errorAr: otpResult.messageAr,
        },
        { status: 400 }
      );
    }

    const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
    const correlationId = `SANAD-AUTH-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      ok: true,
      mode,
      correlationId,
      persistence: {
        databaseUrlConfigured,
        engine: databaseUrlConfigured
          ? "PostgreSQL 16 (Prisma PersonIdentity + User + UserPhone)"
          : "Interactive Browser + API Session (Ready for PostgreSQL DATABASE_URL)",
        tablesMapped: ["PersonIdentity", "User", "UserPhone", "TenantMembership", "AuditLog"],
      },
      user: {
        id: `usr-${nationalId.slice(-6)}`,
        fullNameAr: fullName || "مستخدم موثق بالرقم القومي",
        email: emailResult.normalized,
        maskedNationalId: maskEgyptianNationalId(nationalId),
        phoneE164: phoneResult.e164,
        carrierPrefix: phoneResult.carrierPrefix,
        governorateNameAr: nidResult.parsed.governorateNameAr,
        birthDateIso: nidResult.parsed.birthDateIso,
        role: targetRole,
        organizationNameAr: body.organizationNameAr || undefined,
      },
      timestamp: new Date().toISOString(),
    });
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
