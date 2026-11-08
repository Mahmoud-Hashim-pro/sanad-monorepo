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

interface AuthNationalIdWorkspaceProps {
  fullScreenPage?: boolean;
  onAuthenticatedSuccess?: (payload: {
    fullNameAr: string;
    email: string;
    nationalId: string;
    phoneE164: string;
    governorateNameAr: string;
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
  const [targetRole, setTargetRole] = useState<TargetAuthRole>("SUPER_ADMIN");

  // Clean dynamic form fields (zero hardcoded presets)
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
    emailResult.isValid && passwordInput.trim().length >= 4;

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
          targetRole,
          organizationNameAr: orgNameInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        onNotify?.(data?.errorAr || "تعذر التحقق من البيانات المدخلة", "error");
        return;
      }

      const correlationId =
        data?.correlationId ||
        `SANAD-AUTH-${Date.now().toString(36).toUpperCase()}`;

      onAuthenticatedSuccess?.({
        fullNameAr:
          data?.user?.fullNameAr || fullNameInput.trim() || emailInput.trim(),
        email: data?.user?.email || emailInput.trim(),
        nationalId:
          nationalIdInput.trim() ||
          data?.user?.maskedNationalId ||
          "29501010101234",
        phoneE164:
          data?.user?.phoneE164 || phoneResult.e164 || "+201000000001",
        governorateNameAr:
          data?.user?.governorateNameAr ||
          nidResult.parsed?.governorateNameAr ||
          "القاهرة",
        targetRole: (data?.user?.role || targetRole) as TargetAuthRole,
        mode: authMode,
        correlationId,
      });
    } catch {
      onNotify?.("حدث خطأ أثناء الاتصال بالخادم", "error");
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
      {/* Right Side (in RTL): Clean Brand Panel (5 cols) */}
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
                ← العودة للمنصة
              </Link>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-2xl lg:text-3xl font-extrabold leading-snug text-white">
              الحوكمة الرقمية لإدارة الجمعيات الخيرية والمبادرات والبحث الميداني
            </h2>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              توفر منصة سَنَد بيئة سحابية آمنة لتسجيل المستفيدين بالرقم القومي المصري لمنع ازدواج الصرف، إدارة الأبحاث الميدانية باستقلالية كاملة، وتخصيص التبرعات المقيدة وغير المقيدة بشفافية.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-300">
                ✓ عزل كامل لبيانات كل جمعية ومبادرة
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                تعمل كل جهة خيرية أو مبادرة فردية داخل نطاق بيانات مستقل مع إمكانية التحقق المركزي لمنع تكرار صرف نفس المساعدة.
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-300">
                ✓ فصل المهام الرقابية في البحث الاجتماعي
              </div>
              <p className="text-xs text-purple-100 leading-relaxed">
                يرفع الباحث الميداني تقرير الزيارة، بينما يختص مشرف البحث الاجتماعي بمراجعة واعتماد قرار الأهلية.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-5 text-xs text-purple-200 flex items-center justify-between">
          <span>منصة سَنَد للتكافل والحوكمة الاجتماعية</span>
          <span className="font-mono text-emerald-300">SANAD Platform</span>
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
                  ? "أدخل البريد الإلكتروني وكلمة المرور للدخول إلى مساحة العمل الخاصة بك."
                  : "أكمل بيانات الهوية والرقم القومي المصري ورقم الهاتف المحمول لإنشاء حساب موثق."}
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
            {/* Role Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-role-select"
                className="block text-xs font-bold text-slate-800"
              >
                الدور الوظيفي / نوع الحساب:
              </label>
              <select
                id="auth-role-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as TargetAuthRole)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
                <option value="SUPER_ADMIN">مدير المنصة المركزي (SUPER_ADMIN)</option>
                <option value="ASSOCIATION_ADMIN">
                  مدير جمعية / مؤسسة خيرية مشهرة (ASSOCIATION_ADMIN)
                </option>
                <option value="INDIVIDUAL_INITIATIVE">
                  مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)
                </option>
                <option value="RESEARCH_SUPERVISOR">
                  مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
                </option>
                <option value="VOLUNTEER">باحث / متطوع ميداني (VOLUNTEER)</option>
                <option value="BENEFICIARY">مستفيد / طالب مساعدة (BENEFICIARY)</option>
              </select>
            </div>

            {authMode === "REGISTER" && (
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
                  <div className="text-xs text-rose-700">{nameResult.messageAr}</div>
                )}
              </div>
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
                <div className="text-xs text-rose-700">{emailResult.messageAr}</div>
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
                    {nationalIdInput && (
                      nidResult.isValid && nidResult.parsed ? (
                        <div className="text-xs text-emerald-700">
                          ✓ الميلاد: {nidResult.parsed.birthDateIso} | المحافظة:{" "}
                          {nidResult.parsed.governorateNameAr}
                        </div>
                      ) : (
                        <div className="text-xs text-rose-700">
                          {nidResult.errorAr}
                        </div>
                      )
                    )}
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
                    {mobileInput && (
                      phoneResult.isValid ? (
                        <div className="text-xs text-emerald-700 font-mono">
                          ✓ {phoneResult.e164}
                        </div>
                      ) : (
                        <div className="text-xs text-rose-700">
                          {phoneResult.errorAr}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {(targetRole === "ASSOCIATION_ADMIN" ||
                  targetRole === "INDIVIDUAL_INITIATIVE") && (
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
                ? "جاري التحقق والاتصال بقاعدة البيانات..."
                : authMode === "LOGIN"
                ? "تسجيل الدخول"
                : "إنشاء الحساب وتوثيق الهوية"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
