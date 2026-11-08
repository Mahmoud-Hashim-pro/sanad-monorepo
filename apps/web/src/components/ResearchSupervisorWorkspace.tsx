"use client";

import React, { useState } from "react";
import {
  FIELD_VOLUNTEERS,
  type MockCase,
  type EligibilityDecision,
} from "../lib/mock-data/fictional-seed";
import { Beneficiary360Modal } from "./Beneficiary360Modal";
import {
  type Beneficiary360Profile,
  INITIAL_BENEFICIARIES_PROFILES,
  findOrCreateBeneficiaryProfile,
} from "../lib/mock-data/beneficiaries-data";

interface ResearchSupervisorWorkspaceProps {
  cases: MockCase[];
  beneficiaryProfiles?: Beneficiary360Profile[];
  onSelectBeneficiary?: (profile: Beneficiary360Profile) => void;
  onUpdateBeneficiaryProfile?: (updated: Beneficiary360Profile) => void;
  onAssignVolunteer: (caseId: string, volunteerId: string, volunteerNameAr: string) => void;
  onReviewDecision: (
    caseId: string,
    decision: EligibilityDecision | "NEEDS_REVISION",
    simulateSelfApproval?: boolean
  ) => void;
}

export function ResearchSupervisorWorkspace({
  cases,
  beneficiaryProfiles,
  onSelectBeneficiary,
  onUpdateBeneficiaryProfile,
  onAssignVolunteer,
  onReviewDecision,
}: ResearchSupervisorWorkspaceProps) {
  const [selectedVolunteerByCase, setSelectedVolunteerByCase] = useState<
    Record<string, string>
  >({});
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

  const getSelectedVol = (caseId: string) =>
    selectedVolunteerByCase[caseId] || FIELD_VOLUNTEERS[0].id;

  return (
    <div className="space-y-6">
      {/* Header & SoD Rule Explanation */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
              لوحة مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
            </span>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              فصل المهام الرقابية مفعل (Separation of Duties Enforced)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            إسناد الزيارات الميدانية ومراجعة تقارير الباحثين واعتماد الأهلية
          </h2>
          <p className="text-xs text-slate-600">
            لا يمكن للباحث الميداني اعتماد تقريره بنفسه؛ يتولى مشرف البحث المستقل مراجعة الدخل والمصروفات وتوصية الزيارة قبل إصدار قرار الأهلية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const target = cases[0];
            if (target) {
              onReviewDecision(target.id, "ELIGIBLE", true);
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition"
        >
          محاكاة فحص فصل المهام (اختبار منع الاعتماد الذاتي SoD)
        </button>
      </section>

      {/* Field Research Cases Cards */}
      <section className="grid md:grid-cols-2 gap-5">
        {cases.map((c) => {
          const netDeficit = c.householdExpensesEgp - c.householdIncomeEgp;
          const currentVolId = getSelectedVol(c.id);

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-800">
                      {c.caseNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{c.beneficiaryNameAr}</h3>
                    <p className="text-xs text-slate-500">
                      {c.governorate} • {c.categoryAr} • المطلوب:{" "}
                      <strong>{c.requestedEgp.toLocaleString("ar-EG")} ج.م</strong>
                    </p>
                  </div>
                  <div className="text-left space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBeneficiaryProfile({
                          name: c.beneficiaryNameAr,
                          phone: c.phoneE164,
                          nationalId: c.nationalId || c.maskedNationalId,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] cursor-pointer shadow-sm transition block mb-1"
                    >
                      👤 بروفايل المستفيد 360°
                    </button>
                    <span className="block text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold">
                      البحث: {c.researchStatus}
                    </span>
                    <span className="block text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                      الأهلية: {c.eligibilityDecision}
                    </span>
                  </div>
                </div>

                {/* Assign Volunteer Row */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">الباحث الميداني الحالي:</span>
                    <strong className="text-slate-900">{c.assignedVolunteerAr}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label htmlFor={`vol-select-${c.id}`} className="sr-only">
                      اختيار باحث ميداني للحالة {c.caseNumber}
                    </label>
                    <select
                      id={`vol-select-${c.id}`}
                      value={currentVolId}
                      onChange={(e) =>
                        setSelectedVolunteerByCase((prev) => ({
                          ...prev,
                          [c.id]: e.target.value,
                        }))
                      }
                      className="w-full sm:flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                    >
                      {FIELD_VOLUNTEERS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nameAr} ({v.governorate})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const vol =
                          FIELD_VOLUNTEERS.find((v) => v.id === currentVolId) ||
                          FIELD_VOLUNTEERS[0];
                        onAssignVolunteer(c.id, vol.id, vol.nameAr);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition text-center"
                    >
                      إسناد زيارة ميدانية
                    </button>
                  </div>
                </div>

                {/* Financial & Field Notes Summary */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">الدخل الشهري</span>
                    <strong className="font-mono">
                      {c.householdIncomeEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">المصروفات</span>
                    <strong className="font-mono text-rose-800">
                      {c.householdExpensesEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span className="text-amber-900 block">عجز الأسرة</span>
                    <strong className="font-mono text-amber-950">
                      {netDeficit.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                </div>

                <div className="text-xs bg-purple-50/60 border border-purple-100 rounded-xl p-3 space-y-1">
                  <div className="font-bold text-purple-950">
                    ملاحظات الباحث الميداني (إصدار التقرير v{c.reportVersion}):
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.researchNotesAr}</p>
                </div>
              </div>

              {/* Supervisor Decision Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  إصدار قرار لجنة البحث الاجتماعي والأهلية:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onReviewDecision(c.id, "ELIGIBLE")}
                    className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    اعتماد الأهلية (مؤهل - ELIGIBLE)
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewDecision(c.id, "CONDITIONAL")}
                    className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                  >
                    استحقاق مشروط (CONDITIONAL)
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewDecision(c.id, "NEEDS_REVISION")}
                    className="py-2 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition"
                  >
                    طلب استكمال بيانات (إعادة للباحث)
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewDecision(c.id, "INELIGIBLE")}
                    className="py-2 px-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition"
                  >
                    رفض لعدم الاستحقاق (INELIGIBLE)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

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
