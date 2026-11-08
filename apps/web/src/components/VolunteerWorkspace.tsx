"use client";

import React, { useState } from "react";
import type { MockCase, MockDelivery } from "../lib/mock-data/fictional-seed";
import { Beneficiary360Modal } from "./Beneficiary360Modal";
import {
  type Beneficiary360Profile,
  INITIAL_BENEFICIARIES_PROFILES,
  findOrCreateBeneficiaryProfile,
} from "../lib/mock-data/beneficiaries-data";

interface VolunteerWorkspaceProps {
  cases: MockCase[];
  deliveries: MockDelivery[];
  beneficiaryProfiles?: Beneficiary360Profile[];
  onSelectBeneficiary?: (profile: Beneficiary360Profile) => void;
  onUpdateBeneficiaryProfile?: (updated: Beneficiary360Profile) => void;
  onSubmitFieldReport: (payload: {
    caseId: string;
    incomeEgp: number;
    expensesEgp: number;
    notesAr: string;
  }) => void;
  onConfirmDelivery: (deliveryId: string) => void;
  onAttemptDirectApproval: () => void;
}

export function VolunteerWorkspace({
  cases,
  deliveries,
  beneficiaryProfiles,
  onSelectBeneficiary,
  onUpdateBeneficiaryProfile,
  onSubmitFieldReport,
  onConfirmDelivery,
  onAttemptDirectApproval,
}: VolunteerWorkspaceProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "");
  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0] || null;

  const [selectedBeneficiaryModal, setSelectedBeneficiaryModal] =
    useState<Beneficiary360Profile | null>(null);

  const activeBeneficiaryList = beneficiaryProfiles || INITIAL_BENEFICIARIES_PROFILES;

  const handleOpenBeneficiaryProfile = (target: {
    nationalId?: string;
    phone?: string;
    name?: string;
  }) => {
    const profile = findOrCreateBeneficiaryProfile(target, activeBeneficiaryList);
    if (onSelectBeneficiary && profile) {
      onSelectBeneficiary(profile);
    } else if (profile) {
      setSelectedBeneficiaryModal(profile);
    }
  };

  const [incomeInput, setIncomeInput] = useState<number>(
    activeCase?.householdIncomeEgp || 2600
  );
  const [expensesInput, setExpensesInput] = useState<number>(
    activeCase?.householdExpensesEgp || 6200
  );
  const [notesInput, setNotesInput] = useState<string>(
    activeCase?.researchNotesAr ||
      "تمت الزيارة الميدانية والتحقق من مستندات الأسرة وفواتير العلاج والكهرباء؛ الأسرة مستحقة للدعم."
  );

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setIncomeInput(found.householdIncomeEgp);
      setExpensesInput(found.householdExpensesEgp);
      setNotesInput(found.researchNotesAr);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !notesInput.trim()) return;
    onSubmitFieldReport({
      caseId: activeCase.id,
      incomeEgp: Number(incomeInput),
      expensesEgp: Number(expensesInput),
      notesAr: notesInput.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Volunteer Scope */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
            مساحة عمل الباحث والمتطوع الميداني (VOLUNTEER)
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            رفع تقارير الزيارات الميدانية وتأكيد تسليم المساعدات العينية والنقدية
          </h2>
          <p className="text-xs text-slate-600">
            صلاحيات مقيدة بالمهام المسندة فقط (Task-Scoped Access) مع منع تعديل قرارات الأهلية أو التخصيص المالي.
          </p>
        </div>

        <button
          type="button"
          onClick={onAttemptDirectApproval}
          className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 text-xs font-bold transition"
        >
          محاولة اعتماد الأهلية مباشرة (اختبار صلاحيات المتطوع)
        </button>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Submit Field Research Report Form */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              1. نموذج رفع تقرير البحث الميداني (Field Research Report)
            </h3>
            <p className="text-xs text-slate-600">
              يتم حفظ نسخة مؤقتة وإصدار رقم نسخة جديدة (Report Version) عند الإرسال لمشرف البحث.
            </p>
          </div>

          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="vol-case-select"
                className="block text-xs font-bold text-slate-700"
              >
                اختر الحالة المكلّف بزيارتها ميدانياً:
              </label>
              <select
                id="vol-case-select"
                value={activeCase?.id || ""}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.beneficiaryNameAr} ({c.governorate} | الحالة:{" "}
                    {c.researchStatus})
                  </option>
                ))}
              </select>
              {activeCase && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenBeneficiaryProfile({
                      name: activeCase.beneficiaryNameAr,
                      phone: activeCase.phoneE164,
                      nationalId: activeCase.nationalId || activeCase.maskedNationalId,
                    })
                  }
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>👤</span>
                  <span>معاينة وتحديث ملف المستفيد الشامل (360° Profile)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="vol-income-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  إجمالي دخل الأسرة الشهري الموثق (ج.م)
                </label>
                <input
                  id="vol-income-input"
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="vol-expenses-input"
                  className="block text-xs font-bold text-slate-700"
                >
                  إجمالي التزامات ومصروفات الأسرة (ج.م)
                </label>
                <input
                  id="vol-expenses-input"
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={expensesInput}
                  onChange={(e) => setExpensesInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="vol-notes-textarea"
                className="block text-xs font-bold text-slate-700"
              >
                مشاهدات المعاينة الميدانية وتفاصيل السكن والحالة الصحية:
              </label>
              <textarea
                id="vol-notes-textarea"
                rows={4}
                required
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition"
            >
              إرسال التقرير الميداني للمشرف (تحديث الإصدار إلى v
              {(activeCase?.reportVersion ?? 0) + 1})
            </button>
          </form>
        </section>

        {/* Aid Deliveries Confirmation */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              2. مهام تسليم المساعدات الميدانية (Idempotent Aid Deliveries)
            </h3>
            <p className="text-xs text-slate-600">
              كل عملية تسليم محمية بمفتاح عدم تكرار (<code className="font-mono">idempotencyKey</code>) لضمان عدم خصم المساعدة مرتين.
            </p>
          </div>

          <div className="space-y-3">
            {deliveries.map((deliv) => (
              <div
                key={deliv.id}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-800">
                      {deliv.caseNumber}
                    </span>
                    <div className="font-bold text-sm text-slate-900">
                      {deliv.beneficiaryNameAr}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      deliv.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {deliv.status === "CONFIRMED" ? "تم التسليم والتوثيق ✓" : "مجدول للتسليم"}
                  </span>
                </div>

                <p className="text-xs text-slate-700">{deliv.descriptionAr}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500">القيمة المخصصة: </span>
                    <strong className="font-mono text-purple-900">
                      {deliv.amountEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div className="font-mono text-slate-500">
                    Key: {deliv.idempotencyKey}
                  </div>
                </div>

                {deliv.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    onClick={() => onConfirmDelivery(deliv.id)}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    تأكيد التسليم الفعلي للمستفيد (Idempotent Confirm)
                  </button>
                ) : (
                  <div className="text-xs text-emerald-800 font-semibold">
                    تم التوثيق بتاريخ: {deliv.confirmedAt} — بواسطة: {deliv.assignedVolunteerAr}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Beneficiary 360 Full Details Modal */}
      <Beneficiary360Modal
        profile={selectedBeneficiaryModal}
        isOpen={Boolean(selectedBeneficiaryModal)}
        onClose={() => setSelectedBeneficiaryModal(null)}
        onUpdateProfile={(updated) => {
          setSelectedBeneficiaryModal(updated);
          onUpdateBeneficiaryProfile?.(updated);
        }}
      />
    </div>
  );
}
