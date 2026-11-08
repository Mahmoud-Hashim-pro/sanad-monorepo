"use client";

import React, { useState } from "react";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
import { FICTIONAL_TENANTS, FICTIONAL_CASES } from "../lib/mock-data/fictional-seed";

type ActiveRoleView =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY"
  | "AUTH_LOGIN_REGISTER";

export default function SanadWorkspacePreviewPage() {
  const [activeView, setActiveView] = useState<ActiveRoleView>("ASSOCIATION_ADMIN");
  const [nationalIdInput, setNationalIdInput] = useState("29005151601234");
  const [mobileInput, setMobileInput] = useState("01012345678");
  const [otpInput, setOtpInput] = useState("482910");

  const nidResult = validateEgyptianNationalId(nationalIdInput);
  const phoneResult = normalizeAndValidateEgyptianMobile(mobileInput);

  const currentTenant =
    activeView === "INDIVIDUAL_INITIATIVE"
      ? FICTIONAL_TENANTS[1]
      : FICTIONAL_TENANTS[0];

  const scopedCases = FICTIONAL_CASES.filter((c) => c.tenantId === currentTenant.id);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Preview Safety Banner */}
      <div className="bg-purple-950 text-purple-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-purple-800">
        <div>
          <strong>وضع المعاينة المعماري (Sprint 1 Preview Mode):</strong> جميع البيانات المعروضة خيالية تماماً لأغراض الاختبار. التحقق من الرقم القومي بالمتصفح هو فحص شكلي للصيغة ولا يغني عن فحص عدم التكرار في PostgreSQL.
        </div>
        <span className="bg-purple-800 text-white px-2.5 py-0.5 rounded-full font-mono">
          RTL Arabic • Multi-Tenant • /api/v1
        </span>
      </div>

      {/* Role Switcher Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              س
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">منصة سَنَد (SANAD)</h1>
              <p className="text-xs text-slate-500">
                نظام إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي الميداني
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "SUPER_ADMIN", label: "مدير المنصة" },
              { id: "ASSOCIATION_ADMIN", label: "مدير جمعية خيرية" },
              { id: "INDIVIDUAL_INITIATIVE", label: "مبادر فردي مستقل" },
              { id: "RESEARCH_SUPERVISOR", label: "مشرف البحث الاجتماعي" },
              { id: "VOLUNTEER", label: "باحث / متطوع" },
              { id: "BENEFICIARY", label: "بوابة المستفيد" },
              { id: "AUTH_LOGIN_REGISTER", label: "الدخول والتسجيل (الرقم القومي)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ActiveRoleView)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeView === tab.id
                    ? "bg-purple-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {activeView === "AUTH_LOGIN_REGISTER" ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl mx-auto space-y-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              تسجيل الدخول وإنشاء الحساب بالرقم القومي المصري + تحقق OTP
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                الرقم القومي المصري (14 رقماً - المعرّف الأساسي)
              </label>
              <input
                type="text"
                maxLength={14}
                value={nationalIdInput}
                onChange={(e) => setNationalIdInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
              {nidResult.isValid && nidResult.parsed ? (
                <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-2.5">
                  صيغة الرقم القومي صحيحة — تاريخ الميلاد: <strong>{nidResult.parsed.birthDateIso}</strong> | المحافظة: <strong>{nidResult.parsed.governorateNameAr} ({nidResult.parsed.governorateCode})</strong>
                </div>
              ) : (
                <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-2.5">
                  {nidResult.errorAr}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                رقم الهاتف المحمول المصري (يُطبّع تلقائياً إلى E.164)
              </label>
              <input
                type="text"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
              {phoneResult.isValid ? (
                <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-2.5">
                  الرقم بعد التطبيع القياسي (E.164): <strong dir="ltr">{phoneResult.e164}</strong> (الشبكة: {phoneResult.carrierPrefix})
                </div>
              ) : (
                <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-2.5">
                  {phoneResult.errorAr}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                رمز التحقق عبر الهاتف (OTP - 6 أرقام)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-48 rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono tracking-widest"
              />
            </div>
          </section>
        ) : (
          <>
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                  نطاق المستأجر النشط ({currentTenant.type})
                </span>
                <h2 className="text-xl font-bold mt-1">{currentTenant.nameAr}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  المحافظة: {currentTenant.governorate} {currentTenant.registrationNumber ? `• ${currentTenant.registrationNumber}` : "• مبادر فردي مستقل"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">التبرعات المؤكدة</div>
                  <div className="font-bold text-slate-900">{currentTenant.confirmedDonationsEgp.toLocaleString("ar-EG")} ج.م</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-xs text-amber-800">مبالغ محجوزة للتخصيص</div>
                  <div className="font-bold text-amber-900">{currentTenant.reservedAllocationsEgp.toLocaleString("ar-EG")} ج.م</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-800">الرصيد المتاح للتخصيص</div>
                  <div className="font-bold text-emerald-900">{currentTenant.availableBalanceEgp.toLocaleString("ar-EG")} ج.م</div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-base mb-4">
                سجل الحالات ومسارات الحالة الخمسة المعزولة ({scopedCases.length} حالة ضمن نطاق الجهة الحالية)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3">رقم الحالة</th>
                      <th className="p-3">المستفيد / الأسرة</th>
                      <th className="p-3">حالة الملف (Case)</th>
                      <th className="p-3">حالة البحث (Research)</th>
                      <th className="p-3">قرار الأهلية</th>
                      <th className="p-3">حالة التخصيص</th>
                      <th className="p-3">حالة التسليم الفعلي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedCases.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-mono font-semibold">{c.caseNumber}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{c.beneficiaryNameAr}</div>
                          <div className="text-slate-500 font-mono">{c.maskedNationalId} • {c.householdCode}</div>
                        </td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800">{c.caseStatus}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">{c.researchStatus}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">{c.eligibilityDecision}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800">{c.allocationStatus}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">{c.deliveryStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
