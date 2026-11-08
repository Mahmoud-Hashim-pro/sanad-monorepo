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
} from "../lib/domain/sanad-rules";

export type TargetAuthRole =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY";

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
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic form fields
  const [fullNameInput, setFullNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [nationalIdInput, setNationalIdInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [formErrorAr, setFormErrorAr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time validations
  const nameResult = validateFullName(fullNameInput);
  const emailResult = validateEmailAddress(emailInput);
  const nidResult = validateEgyptianNationalId(nationalIdInput);
  const phoneResult = normalizeAndValidateEgyptianMobile(mobileInput);

  const handleSwitchMode = (nextMode: "LOGIN" | "REGISTER") => {
    setAuthMode(nextMode);
    setFormErrorAr(null);
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorAr(null);

    if (authMode === "LOGIN") {
      if (!emailResult.isValid) {
        const msg =
          emailResult.messageAr || "يرجى إدخال البريد الإلكتروني الصحيح.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
      if (passwordInput.trim().length < 6) {
        const msg = "يرجى إدخال كلمة المرور (6 خانات على الأقل).";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
    } else {
      if (!nameResult.isValid) {
        const msg = nameResult.messageAr || "يرجى إدخال الاسم الكامل رباعياً.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
      if (!emailResult.isValid) {
        const msg =
          emailResult.messageAr || "يرجى إدخال البريد الإلكتروني الصحيح.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
      if (!nidResult.isValid) {
        const msg =
          nidResult.errorAr ||
          "الرقم القومي المصري (14 رقماً) إلزامي؛ يرجى إدخاله بشكل صحيح.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
      if (!phoneResult.isValid) {
        const msg =
          phoneResult.errorAr ||
          "يرجى إدخال رقم الهاتف المحمول المصري بشكل صحيح.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
      if (passwordInput.trim().length < 6) {
        const msg = "يرجى إدخال كلمة مرور لا تقل عن 6 خانات.";
        setFormErrorAr(msg);
        onNotify?.(msg, "error");
        return;
      }
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
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false || !data?.user) {
        const errMsg = data?.errorAr || "تعذر التحقق من البيانات المدخلة.";
        setFormErrorAr(errMsg);
        onNotify?.(errMsg, "error");
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
        nationalIdMasked: data.user.maskedNationalId || "",
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
      const errMsg = "حدث خطأ أثناء الاتصال بالخادم؛ يرجى المحاولة مرة أخرى.";
      setFormErrorAr(errMsg);
      onNotify?.(errMsg, "error");
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
          : "min-h-[calc(100vh-7.5rem)] w-full grid lg:grid-cols-12 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white"
      }
    >
      {/* Right Side (in RTL): Clean Brand Panel About SANAD Platform Only (5 cols) */}
      <aside className="lg:col-span-5 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white p-5 sm:p-7 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 border border-white/25 backdrop-blur flex items-center justify-center font-extrabold text-xl sm:text-2xl text-white shadow-inner shrink-0">
                س
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  منصة سَنَد (SANAD)
                </h1>
                <p className="text-[11px] sm:text-xs text-purple-200">
                  البوابة الموحدة للجمعيات الخيرية والمبادرات والبحث الاجتماعي
                </p>
              </div>
            </div>

            {fullScreenPage && (
              <Link
                href="/"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition shrink-0"
              >
                ← العودة للمنصة
              </Link>
            )}
          </div>

          <div className="space-y-2.5 sm:space-y-4 pt-2 sm:pt-4 lg:pt-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-snug text-white">
              الحوكمة الرقمية لإدارة الجمعيات الخيرية والمبادرات والبحث الميداني
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              توفر منصة سَنَد بيئة موحدة لتسجيل المستفيدين بالرقم القومي المصري لمنع ازدواج الصرف، إدارة الأبحاث الميدانية باستقلالية كاملة، وتخصيص التبرعات المقيدة وغير المقيدة بشفافية.
            </p>
          </div>
        </div>

        <div className="border-t border-white/15 pt-4 text-xs text-purple-200 flex items-center justify-between">
          <span className="text-[11px] sm:text-xs">منصة سَنَد للتكافل والحوكمة الاجتماعية</span>
          <span className="font-mono text-emerald-300 text-[11px] sm:text-xs">SANAD Platform</span>
        </div>
      </aside>

      {/* Left Side (in RTL): Dynamic Auth Form (7 cols) */}
      <section className="lg:col-span-7 bg-white p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-xl w-full mx-auto space-y-5 sm:space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
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

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSwitchMode("LOGIN")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition text-center ${
                  authMode === "LOGIN"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("REGISTER")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition text-center ${
                  authMode === "REGISTER"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                إنشاء حساب جديد
              </button>
            </div>
          </div>

          {formErrorAr && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-900"
            >
              {formErrorAr}
            </div>
          )}

          <form onSubmit={handleSubmitAuth} className="space-y-4" noValidate>
            {authMode === "REGISTER" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-fullname-input"
                  className="block text-xs font-bold text-slate-800"
                >
                  الاسم الكامل رباعياً (كما في بطاقة الرقم القومي) *
                </label>
                <input
                  id="auth-fullname-input"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="أدخل الاسم الرباعي باللغة العربية"
                  value={fullNameInput}
                  onChange={(e) => {
                    setFullNameInput(e.target.value);
                    if (formErrorAr) setFormErrorAr(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm focus:border-purple-600 focus:outline-none"
                />
                {fullNameInput && !nameResult.isValid && (
                  <div className="text-xs text-rose-700">
                    {nameResult.messageAr}
                  </div>
                )}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-bold text-slate-800"
              >
                البريد الإلكتروني (Email) *
              </label>
              <input
                id="auth-email-input"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
                placeholder="name@domain.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (formErrorAr) setFormErrorAr(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
              />
              {emailInput && !emailResult.isValid && (
                <div className="text-xs text-rose-700">
                  {emailResult.messageAr}
                </div>
              )}
            </div>

            {/* Password Input with Built-In Eye Button Inside Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold text-slate-800"
              >
                كلمة المرور *
              </label>
              <div className="relative flex items-center">
                <input
                  id="auth-password-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    authMode === "LOGIN" ? "current-password" : "new-password"
                  }
                  dir="ltr"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (formErrorAr) setFormErrorAr(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 pl-3.5 pr-24 sm:pr-28 py-2.5 text-base sm:text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                  className="absolute right-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition"
                >
                  <span>{showPassword ? "🙈" : "👁️"}</span>
                  <span className="hidden sm:inline">{showPassword ? "إخفاء" : "إظهار"}</span>
                </button>
              </div>
            </div>

            {/* Mandatory National ID & Mobile in Register Mode */}
            {authMode === "REGISTER" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-nid-input"
                    className="block text-xs font-bold text-slate-800"
                  >
                    الرقم القومي المصري (14 رقماً - إلزامي) *
                  </label>
                  <input
                    id="auth-nid-input"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={14}
                    required
                    placeholder="14 رقماً"
                    value={nationalIdInput}
                    onChange={(e) => {
                      const digitsOnly = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 14);
                      setNationalIdInput(digitsOnly);
                      if (formErrorAr) setFormErrorAr(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm font-mono text-left tracking-wider focus:border-purple-600 focus:outline-none"
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
                    رقم الهاتف المحمول المصري (إلزامي) *
                  </label>
                  <input
                    id="auth-mobile-input"
                    type="tel"
                    dir="ltr"
                    required
                    placeholder="010XXXXXXXX"
                    value={mobileInput}
                    onChange={(e) => {
                      setMobileInput(e.target.value);
                      if (formErrorAr) setFormErrorAr(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm font-mono text-left focus:border-purple-600 focus:outline-none"
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
            )}

            {/* Always-Clickable Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white text-sm sm:text-base font-extrabold shadow-md cursor-pointer transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting
                ? "جاري التحقق..."
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
