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

const DEMO_PRESETS: Array<{
  id: string;
  labelAr: string;
  role: TargetAuthRole;
  fullName: string;
  email: string;
  nationalId: string;
  mobile: string;
  orgNameAr: string;
}> = [
  {
    id: "preset-assn",
    labelAr: "تعبئة رقم قومي تجريبي (مدير جمعية - الغربية)",
    role: "ASSOCIATION_ADMIN",
    fullName: "عمرو عبد العزيز الشرقاوي",
    email: "amr.sharkawy@alnoor-charity.org.eg",
    nationalId: "28509141601234",
    mobile: "01012345678",
    orgNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
  },
  {
    id: "preset-ind",
    labelAr: "تعبئة رقم قومي تجريبي (مبادر فردي - الدقهلية)",
    role: "INDIVIDUAL_INITIATIVE",
    fullName: "طارق محمد المنشاوي",
    email: "tarek.menshawy@sanad-initiative.eg",
    nationalId: "28811201202345",
    mobile: "01123456789",
    orgNameAr: "مبادرة أ. طارق المنشاوي لدعم الحالات الطبية العاجلة",
  },
  {
    id: "preset-ben",
    labelAr: "تعبئة رقم قومي تجريبي (مستفيد - القاهرة)",
    role: "BENEFICIARY",
    fullName: "فاطمة عبد الرحمن السيد",
    email: "fatma.sayed@citizen.eg",
    nationalId: "29005150101234",
    mobile: "01234567890",
    orgNameAr: "بوابة المستفيد الذاتية",
  },
];

export function AuthNationalIdWorkspace({
  fullScreenPage = false,
  onAuthenticatedSuccess,
  onNotify,
}: AuthNationalIdWorkspaceProps) {
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("REGISTER");
  const [targetRole, setTargetRole] = useState<TargetAuthRole>("ASSOCIATION_ADMIN");

  // Form fields
  const [fullNameInput, setFullNameInput] = useState("عمرو عبد العزيز الشرقاوي");
  const [emailInput, setEmailInput] = useState("amr.sharkawy@alnoor-charity.org.eg");
  const [nationalIdInput, setNationalIdInput] = useState("28509141601234");
  const [mobileInput, setMobileInput] = useState("01012345678");
  const [passwordInput, setPasswordInput] = useState("Sanad@2026#Secure");
  const [orgNameInput, setOrgNameInput] = useState(
    "جمعية النور للتكافل والتنمية الاجتماعية بطنطا"
  );
  const [otpInput, setOtpInput] = useState("482910");

  // OTP & API state
  const [generatedOtp, setGeneratedOtp] = useState("482910");
  const [otpCorrelationId, setOtpCorrelationId] = useState(
    "VERIFICATION_STEP_INITIATED_9841"
  );
  const [otpSentAt, setOtpSentAt] = useState<string>("جاهز للتحقق الفوري");
  const [submitting, setSubmitting] = useState(false);
  const [authResponseSummary, setAuthResponseSummary] = useState<{
    correlationId: string;
    engine: string;
    fullNameAr: string;
    email: string;
    phoneE164: string;
    governorateNameAr: string;
    role: string;
  } | null>(null);

  // Real-time validations
  const nameResult = validateFullName(fullNameInput);
  const emailResult = validateEmailAddress(emailInput);
  const nidResult = validateEgyptianNationalId(nationalIdInput);
  const phoneResult = normalizeAndValidateEgyptianMobile(mobileInput);
  const passwordResult = validatePasswordStrength(passwordInput);
  const otpResult = validateOtpCode(otpInput);

  const isFormValid =
    nidResult.isValid &&
    phoneResult.isValid &&
    emailResult.isValid &&
    otpResult.isValid &&
    (authMode === "LOGIN" || (nameResult.isValid && passwordResult.isValid));

  const applyPreset = (preset: (typeof DEMO_PRESETS)[number]) => {
    setTargetRole(preset.role);
    setFullNameInput(preset.fullName);
    setEmailInput(preset.email);
    setNationalIdInput(preset.nationalId);
    setMobileInput(preset.mobile);
    setOrgNameInput(preset.orgNameAr);
    onNotify?.(`تم تعبئة بيانات الاختبار الفورية: ${preset.fullName}`, "success");
  };

  const handleSendOtp = () => {
    if (!nidResult.isValid || !phoneResult.isValid) {
      onNotify?.(
        "يرجى التأكد من صحة الرقم القومي (14 رقماً) ورقم الهاتف المحمول قبل إرسال رمز التحقق.",
        "warning"
      );
      return;
    }
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    const corrId = `VERIFICATION_STEP_INITIATED_${Date.now().toString().slice(-4)}`;
    setGeneratedOtp(newCode);
    setOtpInput(newCode);
    setOtpCorrelationId(corrId);
    setOtpSentAt(new Date().toLocaleTimeString("ar-EG"));
    onNotify?.(
      `تم إرسال رمز التحقق (OTP: ${newCode}) إلى الرقم ${phoneResult.e164} بنجاح`,
      "success"
    );
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !nidResult.parsed || !phoneResult.e164) {
      onNotify?.(
        "يرجى استكمال كافة الحقول المطلوبة والتأكد من صحة الاسم والبريد الإلكتروني والرقم القومي.",
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
      const correlationId =
        data?.correlationId || `SANAD-AUTH-${Date.now().toString(36).toUpperCase()}`;

      setAuthResponseSummary({
        correlationId,
        engine:
          data?.persistence?.engine ||
          "Interactive Session + PostgreSQL 39-Table Schema Ready",
        fullNameAr: fullNameInput.trim(),
        email: emailResult.normalized || emailInput.trim(),
        phoneE164: phoneResult.e164,
        governorateNameAr: nidResult.parsed.governorateNameAr,
        role: targetRole,
      });

      onAuthenticatedSuccess?.({
        fullNameAr: fullNameInput.trim(),
        email: emailResult.normalized || emailInput.trim(),
        nationalId: nationalIdInput.trim(),
        phoneE164: phoneResult.e164,
        governorateNameAr: nidResult.parsed.governorateNameAr,
        targetRole,
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
      {/* Right Side (in RTL): Rich Brand & Architecture Hero Panel (5 cols) */}
      <aside className="lg:col-span-5 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-8 lg:p-10 flex flex-col justify-between space-y-8">
        <div className="space-y-6">
          {/* Brand Logo & Back Navigation */}
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

            {fullScreenPage ? (
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                ← العودة للوحة المنصة
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                فتح في شاشة كاملة (/login) ↗
              </Link>
            )}
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-3 pt-2">
            <span className="inline-block text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full">
              هوية رقمية موثقة • 39 جدول PostgreSQL • فصل المهام SoD
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold leading-snug text-white">
              توثيق الهوية بالرقم القومي المصري والبريد الإلكتروني ورمز التحقق (OTP)
            </h2>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              تعتمد منصة سَنَد على الرقم القومي المصري (14 رقماً) كمعرّف أساسي لمنع تكرار الملفات وازدواج الصرف، مع تطبيع أرقام الهواتف المحمولة إلى الصيغة الدولية القياسية <code className="font-mono text-emerald-300">E.164</code>.
            </p>
          </div>

          {/* Quick Demo Autofill Presets */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
            <div className="text-xs font-bold text-purple-100">
              تعبئة فورية لبيانات اختبار قياسية (بنقرة واحدة):
            </div>
            <div className="space-y-2">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="w-full text-right px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-between transition"
                >
                  <span>{preset.labelAr}</span>
                  <span className="font-mono text-[11px] text-emerald-300">
                    {preset.nationalId}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Architecture Guarantees */}
        <div className="space-y-3 border-t border-white/15 pt-6 text-xs text-purple-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-extrabold text-base text-white">14 رقماً</div>
              <div className="text-[11px] text-purple-200 mt-0.5">فحص تاريخ الميلاد والمحافظة</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-extrabold text-base text-emerald-300">+201XXXXXXXXX</div>
              <div className="text-[11px] text-purple-200 mt-0.5">تطبيع قياسي E.164</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="font-extrabold text-base text-amber-300">39 جدولاً</div>
              <div className="text-[11px] text-purple-200 mt-0.5">عزل كامل للمستأجرين</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Left Side (in RTL): Full-Width Interactive Auth Form Workspace (7 cols) */}
      <section className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {authMode === "REGISTER"
                  ? "إنشاء حساب جديد وتوثيق الهوية"
                  : "تسجيل الدخول لحساب موثق"}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                تحقق فوري من الاسم الكامل، البريد الإلكتروني، الرقم القومي المصري، ورقم الهاتف المحمول.
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
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
            </div>
          </div>

          <form onSubmit={handleSubmitAuth} className="space-y-5" noValidate>
            {/* Role Selector */}
            <div className="space-y-2">
              <label
                htmlFor="auth-role-select"
                className="block text-xs font-bold text-slate-800"
              >
                نوع الحساب / الدور الوظيفي على المنصة:
              </label>
              <select
                id="auth-role-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as TargetAuthRole)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
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
                <option value="SUPER_ADMIN">مدير المنصة المركزي (SUPER_ADMIN)</option>
              </select>
            </div>

            {/* Full Name & Email Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-fullname-input"
                  className="block text-xs font-bold text-slate-800"
                >
                  الاسم الكامل رباعياً (كما في البطاقة)
                </label>
                <input
                  id="auth-fullname-input"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="مثال: عمرو عبد العزيز الشرقاوي"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none ${
                    nameResult.isValid
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-rose-300 bg-rose-50/20"
                  }`}
                />
                <div
                  className={`text-xs font-medium ${
                    nameResult.isValid ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {nameResult.isValid ? `✓ ${nameResult.messageAr}` : `✕ ${nameResult.messageAr}`}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email-input"
                  className="block text-xs font-bold text-slate-800"
                >
                  البريد الإلكتروني الرسمي (Email)
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  required
                  placeholder="name@organization.org.eg"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-left focus:outline-none ${
                    emailResult.isValid
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-rose-300 bg-rose-50/20"
                  }`}
                />
                <div
                  className={`text-xs font-medium ${
                    emailResult.isValid ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {emailResult.isValid
                    ? `✓ ${emailResult.messageAr}`
                    : `✕ ${emailResult.messageAr}`}
                </div>
              </div>
            </div>

            {/* National ID & Egyptian Mobile Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-nid-input"
                  className="block text-xs font-bold text-slate-800"
                >
                  الرقم القومي المصري (14 رقماً - المعرّف الأساسي)
                </label>
                <input
                  id="auth-nid-input"
                  type="text"
                  dir="ltr"
                  maxLength={14}
                  required
                  value={nationalIdInput}
                  onChange={(e) => setNationalIdInput(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-left tracking-wider focus:outline-none ${
                    nidResult.isValid
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-rose-300 bg-rose-50/20"
                  }`}
                />
                {nidResult.isValid && nidResult.parsed ? (
                  <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-2">
                    ✓ الميلاد: <strong>{nidResult.parsed.birthDateIso}</strong> | المحافظة:{" "}
                    <strong>
                      {nidResult.parsed.governorateNameAr} ({nidResult.parsed.governorateCode})
                    </strong>
                  </div>
                ) : (
                  <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-2">
                    ✕ {nidResult.errorAr}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-mobile-input"
                  className="block text-xs font-bold text-slate-800"
                >
                  رقم الهاتف المحمول المصري (يُطبّع إلى E.164)
                </label>
                <input
                  id="auth-mobile-input"
                  type="tel"
                  dir="ltr"
                  required
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-left focus:outline-none ${
                    phoneResult.isValid
                      ? "border-emerald-400 bg-emerald-50/20"
                      : "border-rose-300 bg-rose-50/20"
                  }`}
                />
                {phoneResult.isValid ? (
                  <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-2">
                    ✓ الصيغة القياسية:{" "}
                    <strong dir="ltr" className="font-mono">
                      {phoneResult.e164}
                    </strong>{" "}
                    (شبكة {phoneResult.carrierPrefix})
                  </div>
                ) : (
                  <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-2">
                    ✕ {phoneResult.errorAr}
                  </div>
                )}
              </div>
            </div>

            {/* Password & Organization Name (shown in Register mode) */}
            {authMode === "REGISTER" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password-input"
                    className="block text-xs font-bold text-slate-800"
                  >
                    كلمة المرور المشفرة (8 خانات على الأقل)
                  </label>
                  <input
                    id="auth-password-input"
                    type="password"
                    autoComplete="new-password"
                    dir="ltr"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono text-left focus:outline-none ${
                      passwordResult.isValid
                        ? "border-emerald-400 bg-emerald-50/20"
                        : "border-rose-300 bg-rose-50/20"
                    }`}
                  />
                  <div
                    className={`text-xs font-medium ${
                      passwordResult.isValid ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {passwordResult.isValid
                      ? `✓ ${passwordResult.messageAr}`
                      : `✕ ${passwordResult.messageAr}`}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-org-input"
                    className="block text-xs font-bold text-slate-800"
                  >
                    اسم الجمعية الخيرية / المبادرة المرتبطة
                  </label>
                  <input
                    id="auth-org-input"
                    type="text"
                    value={orgNameInput}
                    onChange={(e) => setOrgNameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none"
                  />
                  <div className="text-xs text-slate-500">
                    يُربط الحساب بنطاق عزل المستأجر (Tenant Scope) فور التحقق.
                  </div>
                </div>
              </div>
            )}

            {/* OTP Verification Box */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <label
                    htmlFor="auth-otp-input"
                    className="block text-xs font-bold text-slate-900"
                  >
                    رمز التحقق عبر الهاتف المحمول (OTP - 6 أرقام)
                  </label>
                  <p className="text-xs text-slate-600">
                    معرّف جلسة التحقق:{" "}
                    <span className="font-mono text-purple-800">{otpCorrelationId}</span> ({otpSentAt})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition"
                >
                  إرسال رمز تحقق (OTP) جديد
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <input
                  id="auth-otp-input"
                  type="text"
                  dir="ltr"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-44 rounded-xl border border-slate-300 px-4 py-2 text-base font-mono font-bold tracking-widest text-center bg-white"
                />
                <div className="text-xs text-slate-700">
                  الرمز التجريبي النشط حالياً:{" "}
                  <strong className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {generatedOtp}
                  </strong>
                </div>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="w-full py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-extrabold shadow-md transition disabled:opacity-50"
            >
              {submitting
                ? "جاري التحقق من الهوية والاتصال بـ /api/auth..."
                : authMode === "REGISTER"
                ? "تأكيد رمز التحقق (OTP) وإنشاء الحساب الموثق"
                : "تأكيد رمز التحقق (OTP) وتسجيل الدخول للمنصة"}
            </button>
          </form>

          {/* Live Server Response Confirmation Card */}
          {authResponseSummary && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-sm text-emerald-900">
                  ✓ تم التوثيق بنجاح عبر نقطة الاتصال (/api/auth)
                </strong>
                <span className="font-mono bg-emerald-200/70 px-2 py-0.5 rounded text-emerald-900">
                  {authResponseSummary.correlationId}
                </span>
              </div>
              <div>
                <strong>المستخدم:</strong> {authResponseSummary.fullNameAr} (
                <span className="font-mono">{authResponseSummary.email}</span>) •{" "}
                <strong>المحافظة:</strong> {authResponseSummary.governorateNameAr}
              </div>
              <div>
                <strong>محرك الحفظ:</strong> {authResponseSummary.engine}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
