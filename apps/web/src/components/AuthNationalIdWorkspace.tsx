"use client";

import React, { useState } from "react";
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
        const msg = emailResult.messageAr || "يرجى إدخال البريد الإلكتروني الصحيح.";
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
        const msg = emailResult.messageAr || "يرجى إدخال البريد الإلكتروني الصحيح.";
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
          phoneResult.errorAr || "يرجى إدخال رقم الهاتف المحمول المصري بشكل صحيح.";
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
          ? "min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 sm:p-6"
          : "min-h-[calc(100vh-8rem)] w-full flex items-center justify-center py-6 px-4"
      }
    >
      <section className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 space-y-6">
        {/* Clean Brand Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm shrink-0">
            س
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              منصة سَنَد (SANAD)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              البوابة الموحدة للجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchMode("LOGIN")}
              className={`py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                authMode === "LOGIN"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("REGISTER")}
              className={`py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                authMode === "REGISTER"
                  ? "bg-purple-700 text-white shadow-sm"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {authMode === "LOGIN"
                ? "تسجيل الدخول إلى حسابك"
                : "إنشاء حساب جديد بالرقم القومي المصري"}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {authMode === "LOGIN"
                ? "أدخل البريد الإلكتروني وكلمة المرور؛ يتعرف النظام تلقائياً على دورك وصلاحياتك المعتمدة."
                : "جميع الحقول التالية إلزامية لتوثيق الهوية وحفظ بياناتك في قاعدة البيانات."}
            </p>
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
                الاسم الكامل رباعياً (إلزامي كما في بطاقة الرقم القومي) *
              </label>
              <input
                id="auth-fullname-input"
                type="text"
                autoComplete="name"
                required
                placeholder="مثال: محمد أحمد محمود علي"
                value={fullNameInput}
                onChange={(e) => {
                  setFullNameInput(e.target.value);
                  if (formErrorAr) setFormErrorAr(null);
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
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
              البريد الإلكتروني (Email) *
            </label>
            <input
              id="auth-email-input"
              type="email"
              autoComplete="email"
              dir="ltr"
              required
              placeholder="example@domain.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (formErrorAr) setFormErrorAr(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
            />
            {emailInput && !emailResult.isValid && (
              <div className="text-xs text-rose-700">{emailResult.messageAr}</div>
            )}
          </div>

          {/* Mandatory National ID & Mobile in Register Mode */}
          {authMode === "REGISTER" && (
            <>
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
                  placeholder="أدخل الـ 14 رقماً للبطاقة"
                  value={nationalIdInput}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 14);
                    setNationalIdInput(digitsOnly);
                    if (formErrorAr) setFormErrorAr(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left tracking-wider focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                />
                {nationalIdInput &&
                  (nidResult.isValid && nidResult.parsed ? (
                    <div className="text-xs text-emerald-700 font-semibold">
                      ✓ الرقم القومي صحيح — تاريخ الميلاد: {nidResult.parsed.birthDateIso} | المحافظة:{" "}
                      {nidResult.parsed.governorateNameAr}
                    </div>
                  ) : (
                    <div className="text-xs text-rose-700">{nidResult.errorAr}</div>
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
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                />
                {mobileInput &&
                  (phoneResult.isValid ? (
                    <div className="text-xs text-emerald-700 font-mono">
                      ✓ {phoneResult.e164}
                    </div>
                  ) : (
                    <div className="text-xs text-rose-700">{phoneResult.errorAr}</div>
                  ))}
              </div>
            </>
          )}

          {/* Password Input with Clickable Show/Hide Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-bold text-slate-800"
              >
                كلمة المرور *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                {showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              </button>
            </div>
            <input
              id="auth-password-input"
              type={showPassword ? "text" : "password"}
              autoComplete={
                authMode === "LOGIN" ? "current-password" : "new-password"
              }
              dir="ltr"
              required
              placeholder="6 خانات على الأقل"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (formErrorAr) setFormErrorAr(null);
              }}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-left focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
            />
          </div>

          {/* Always-Clickable Primary Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white text-sm font-extrabold shadow-md cursor-pointer transition disabled:opacity-60"
          >
            {submitting
              ? "جاري التحقق والاتصال بقاعدة البيانات..."
              : authMode === "LOGIN"
              ? "تسجيل الدخول"
              : "إنشاء الحساب وحفظ البيانات"}
          </button>
        </form>
      </section>
    </div>
  );
}
