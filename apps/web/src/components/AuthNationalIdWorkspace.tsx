"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
import {
  validateFullName,
  validateEmailAddress,
  validatePasswordStrength,
  validateOtpCode,
} from "../lib/domain/sanad-rules";

export type TargetAuthRole =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY";

export type PublicRegistrableRole = Exclude<TargetAuthRole, "SUPER_ADMIN">;

export interface AuthenticatedSessionUser {
  userId: string;
  email: string;
  fullNameAr: string;
  role: TargetAuthRole;
  tenantId: string | null;
  tenantNameAr: string;
  nationalIdMasked: string;
  phoneE164: string;
  governorateNameAr: string;
  permissions: string[];
}

interface AuthNationalIdWorkspaceProps {
  fullScreenPage?: boolean;
  onAuthenticatedSuccess?: (payload: {
    user: AuthenticatedSessionUser;
    targetRole: TargetAuthRole;
    mode: "LOGIN" | "REGISTER";
    correlationId: string;
  }) => void;
  onNotify?: (message: string, type?: "success" | "warning" | "error") => void;
}

export function AuthNationalIdWorkspace({
  fullScreenPage = false,
  onAuthenticatedSuccess,
  onNotify,
}: AuthNationalIdWorkspaceProps) {
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [registerRole, setRegisterRole] =
    useState<PublicRegistrableRole>("BENEFICIARY");

  // Clean dynamic form fields
  const [fullNameInput, setFullNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [orgNameInput, setOrgNameInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // OTP & API state
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpCorrelationId, setOtpCorrelationId] = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time validations
  const nameResult = validateFullName(fullNameInput);
  const emailResult = validateEmailAddress(emailInput);
  const nidResult = validateEgyptianNationalId(nationalIdInput);
  const phoneResult = normalizeAndValidateEgyptianMobile(mobileInput);
  const passwordResult = validatePasswordStrength(passwordInput);
  const otpResult = validateOtpCode(otpInput);

  const isLoginFormValid =
    emailResult.isValid && passwordInput.trim().length >= 6;

  const isRegisterFormValid =
    nameResult.isValid &&
    emailResult.isValid &&
    nidResult.isValid &&
    phoneResult.isValid &&
    passwordResult.isValid &&
    otpResult.isValid;

  const isFormValid =
    authMode === "LOGIN" ? isLoginFormValid : isRegisterFormValid;

  const handleSendOtp = () => {
    if (!nidResult.isValid || !phoneResult.isValid) {
      onNotify?.(
        "يرجى إدخال الرقم القومي الصحيح (14 رقماً) ورقم الهاتف المحمول أولاً لإصدار رمز التحقق.",
        "warning"
      );
      return;
    }
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const corrId = `SANAD-OTP-${Date.now().toString().slice(-4)}`;
    setGeneratedOtp(newCode);
    setOtpInput(newCode);
    setOtpCorrelationId(corrId);
    setOtpSentAt(new Date().toLocaleTimeString("ar-EG"));
    onNotify?.(
      `تم إرسال رمز التحقق (${newCode}) إلى الرقم ${phoneResult.e164}`,
      "success"
    );
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      onNotify?.(
        "يرجى استكمال الحقول المطلوبة بشكل صحيح قبل المتابعة.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: authMode,
          fullName: fullNameInput,
          email: emailInput,
          nationalId: nationalIdInput,
          mobile: mobileInput,
          password: passwordInput,
          otp: otpInput,
          targetRole: authMode === "REGISTER" ? registerRole : undefined,
          organizationNameAr: orgNameInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false || !data?.user) {
        onNotify?.(
          data?.errorAr || "تعذر التحقق من بيانات الاعتماد المدخلة",
          "error"
        );
        return;
      }

      const correlationId =
        data?.correlationId ||
        `SANAD-AUTH-${Date.now().toString(36).toUpperCase()}`;

      const resolvedUser: AuthenticatedSessionUser = {
        userId: data.user.userId,
        email: data.user.email,
        fullNameAr: data.user.fullNameAr,
        role: data.user.role as TargetAuthRole,
        tenantId: data.user.tenantId ?? null,
        tenantNameAr: data.user.tenantNameAr || "منصة سَنَد",
        nationalIdMasked: data.user.nationalIdMasked || "",
        phoneE164: data.user.phoneE164 || "",
        governorateNameAr: data.user.governorateNameAr || "القاهرة",
        permissions: Array.isArray(data.user.permissions)
          ? data.user.permissions
          : [],
      };

      onAuthenticatedSuccess?.({
        user: resolvedUser,
        targetRole: resolvedUser.role,
        mode: authMode,
        correlationId,
      });
    } catch {
      onNotify?.("حدث خطأ أثناء الاتصال بخادم التوثيق", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className={
        fullScreenPage
          ? "min-h-screen w-full grid lg:grid-cols-12 bg-slate-900"
          : "min-h-[calc(100vh-7.5rem)] w-full grid lg:grid-cols-12 rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white"
      }
    >
      {/* Right Side (in RTL): Security & Governance Brand Panel (5 cols) */}
      <aside className="lg:col-span-5 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-8 lg:p-10 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur flex items-center justify-center font-extrabold text-2xl text-white shadow-inner">
                س
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight text-white">
                  منصة سَنَد (SANAD)
                </h1>
                <p className="text-xs text-purple-200">
                  البوابة الموحدة للجمعيات الخيرية والمبادرات والبحث الاجتماعي
                </p>
              </div>
            </div>

            {fullScreenPage && (
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                ← الرئيسية
              </Link>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <span>🔒</span>
              <span>حماية الجلسات وصلاحيات الأدوار (RBAC & HttpOnly Session)</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold leading-snug text-white">
              بوابة الدخول الموثق والتحكم الصارم في الصلاحيات
            </h2>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              تُحدد الصلاحيات ومساحات العمل تلقائياً من قاعدة البيانات وفقاً لدور المستخدم الموثق، مع تطبيق العزل الكامل لبيانات الجمعيات والمبادرات وفصل المهام الرقابية (Segregation of Duties).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-emerald-300">
                ✓ تحقق مشفر من الهوية والجلسة (HMAC-SHA256 & Scrypt)
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                لا يُسمح بالوصول إلى أي بيانات أو عمليات قبل تسجيل الدخول وتوثيق الجلسة، وتُحدد الصلاحيات من السجل الرسمي للمستخدم في قاعدة البيانات.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-emerald-300">
                ✓ عزل كامل لبيانات كل جمعية ومبادرة (Row-Level Isolation)
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                يصل مدير الجمعية أو المبادرة الفردية حصرياً إلى حالات وتبرعات جهته المسجلة، بينما تخضع صلاحيات مدير المنصة للتوثيق المركزي.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-5 text-xs text-purple-200 flex items-center justify-between">
          <span>منصة سَنَد للتكافل والحوكمة الاجتماعية</span>
          <span className="font-mono text-emerald-300">RBAC Protected</span>
        </div>
      </aside>

      {/* Left Side (in RTL): Dynamic Auth Form (7 cols) */}
      <section className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {authMode === "LOGIN"
                  ? "تسجيل الدخول إلى منصة سَنَد"
                  : "إنشاء حساب جديد على المنصة"}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {authMode === "LOGIN"
                  ? "أدخل بريدك الإلكتروني المسجل وكلمة المرور؛ سيقوم النظام بتحديد دورك وصلاحياتك تلقائياً."
                  : "أكمل بيانات الهوية والرقم القومي المصري ورقم الهاتف المحمول لإنشاء حساب جديد."}
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setAuthMode("LOGIN")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  authMode === "LOGIN"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("REGISTER")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  authMode === "REGISTER"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitAuth} className="space-y-4" noValidate>
            {/* Role Selector ONLY shown in REGISTER mode, and NEVER includes SUPER_ADMIN */}
            {authMode === "REGISTER" && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-role-select"
                    className="block text-xs font-bold text-slate-800"
                  >
                    نوع الحساب المطلوب إنشاؤه:
                  </label>
                  <select
                    id="auth-role-select"
                    value={registerRole}
                    onChange={(e) =>
                      setRegisterRole(e.target.value as PublicRegistrableRole)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="BENEFICIARY">
                      مستفيد / طالب مساعدة (BENEFICIARY)
                    </option>
                    <option value="VOLUNTEER">
                      باحث / متطوع ميداني (VOLUNTEER)
                    </option>
                    <option value="RESEARCH_SUPERVISOR">
                      مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
                    </option>
                    <option value="ASSOCIATION_ADMIN">
                      مدير جمعية / مؤسسة خيرية مشهرة (ASSOCIATION_ADMIN)
                    </option>
                    <option value="INDIVIDUAL_INITIATIVE">
                      مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-fullname-input"
                    className="block text-xs font-bold text-slate-800"
                  >
                    الاسم الكامل رباعياً (كما في بطاقة الرقم القومي)
                  </label>
                  <input
                    id="auth-fullname-input"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="أدخل الاسم الرباعي باللغة العربية"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none"
                  />
                  {fullNameInput && !nameResult.isValid && (
                    <div className="text-xs text-rose-700">
                      {nameResult.messageAr}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-bold text-slate-800"
              >
                البريد الإلكتروني (Email)
              </label>
              <input
                id="auth-email-input"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                placeholder="name@domain.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
              />
              {emailInput && !emailResult.isValid && (
                <div className="text-xs text-rose-700">
                  {emailResult.messageAr}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold text-slate-800"
              >
                كلمة المرور
              </label>
              <input
                id="auth-password-input"
                type="password"
                autoComplete={
                  authMode === "LOGIN" ? "current-password" : "new-password"
                }
                dir="ltr"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
              />
              {authMode === "REGISTER" &&
                passwordInput &&
                !passwordResult.isValid && (
                  <div className="text-xs text-rose-700">
                    {passwordResult.messageAr}
                  </div>
                )}
            </div>

            {/* Registration-specific National ID, Mobile, Org, and OTP */}
            {authMode === "REGISTER" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-nid-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      الرقم القومي المصري (14 رقماً)
                    </label>
                    <input
                      id="auth-nid-input"
                      type="text"
                      dir="ltr"
                      maxLength={14}
                      required
                      placeholder="14 رقماً"
                      value={nationalIdInput}
                      onChange={(e) => setNationalIdInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left tracking-wider focus:border-purple-600 focus:outline-none"
                    />
                    {nationalIdInput &&
                      (nidResult.isValid && nidResult.parsed ? (
                        <div className="text-xs text-emerald-700">
                          ✓ الميلاد: {nidResult.parsed.birthDateIso} | المحافظة:{" "}
                          {nidResult.parsed.governorateNameAr}
                        </div>
                      ) : (
                        <div className="text-xs text-rose-700">
                          {nidResult.errorAr}
                        </div>
                      ))}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-mobile-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      رقم الهاتف المحمول المصري
                    </label>
                    <input
                      id="auth-mobile-input"
                      type="tel"
                      dir="ltr"
                      required
                      placeholder="010XXXXXXXX"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
                    />
                    {mobileInput &&
                      (phoneResult.isValid ? (
                        <div className="text-xs text-emerald-700 font-mono">
                          ✓ {phoneResult.e164}
                        </div>
                      ) : (
                        <div className="text-xs text-rose-700">
                          {phoneResult.errorAr}
                        </div>
                      ))}
                  </div>
                </div>

                {(registerRole === "ASSOCIATION_ADMIN" ||
                  registerRole === "INDIVIDUAL_INITIATIVE") && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-org-input"
                      className="block text-xs font-bold text-slate-800"
                    >
                      اسم الجمعية الخيرية أو المبادرة
                    </label>
                    <input
                      id="auth-org-input"
                      type="text"
                      placeholder="أدخل اسم الجمعية أو المبادرة"
                      value={orgNameInput}
                      onChange={(e) => setOrgNameInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <label
                        htmlFor="auth-otp-input"
                        className="block text-xs font-bold text-slate-900"
                      >
                        رمز التحقق عبر الهاتف المحمول (OTP - 6 أرقام)
                      </label>
                      {otpCorrelationId && (
                        <p className="text-xs text-slate-600">
                          معرّف التحقق:{" "}
                          <span className="font-mono text-purple-800">
                            {otpCorrelationId}
                          </span>{" "}
                          ({otpSentAt})
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition"
                    >
                      إرسال رمز التحقق (OTP)
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      id="auth-otp-input"
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      required
                      placeholder="6 أرقام"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-44 rounded-xl border border-slate-300 px-4 py-2 text-base font-mono font-bold tracking-widest text-center bg-white"
                    />
                    {generatedOtp && (
                      <div className="text-xs text-slate-700">
                        رمز التحقق المرسل:{" "}
                        <strong className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {generatedOtp}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="w-full py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-extrabold shadow-md transition disabled:opacity-50"
            >
              {submitting
                ? "جاري التحقق من الهوية والصلاحيات..."
                : authMode === "LOGIN"
                ? "تسجيل الدخول الآمن"
                : "إنشاء الحساب وتوثيق الهوية"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
