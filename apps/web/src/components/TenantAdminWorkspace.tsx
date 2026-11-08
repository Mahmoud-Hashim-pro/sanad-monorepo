"use client";

import React, { useState } from "react";
import {
  validateEgyptianNationalId,
  normalizeAndValidateEgyptianMobile,
} from "@sanad/shared";
import {
  AID_CATEGORIES_LABELS,
  type AidCategoryCode,
  type MockTenant,
  type MockCase,
  type MockDonation,
} from "../lib/mock-data/fictional-seed";
import { validateAllocationRequest } from "../lib/domain/sanad-rules";

interface TenantAdminWorkspaceProps {
  mode: "ASSOCIATION" | "INDIVIDUAL";
  currentTenant: MockTenant;
  availableTenantsOfType: MockTenant[];
  onSelectTenantId: (tenantId: string) => void;
  scopedCases: MockCase[];
  scopedDonations: MockDonation[];
  onCreateCase: (payload: {
    tenantId: string;
    beneficiaryNameAr: string;
    nationalId: string;
    phoneE164: string;
    governorate: string;
    targetType: "HOUSEHOLD" | "PERSON";
    category: AidCategoryCode;
    requestedEgp: number;
  }) => void;
  onCreateDonation: (payload: {
    tenantId: string;
    donorNameAr: string;
    donationType: "MONETARY" | "IN_KIND";
    restrictedCategory: AidCategoryCode | "UNRESTRICTED";
    totalAmountEgp: number;
    initialStatus: "CONFIRMED" | "PENDING_VERIFICATION";
  }) => void;
  onConfirmDonation: (donationId: string) => void;
  onAllocateAtomic: (payload: {
    donationId: string;
    caseId: string;
    amountEgp: number;
  }) => void;
}

export function TenantAdminWorkspace({
  mode,
  currentTenant,
  availableTenantsOfType,
  onSelectTenantId,
  scopedCases,
  scopedDonations,
  onCreateCase,
  onCreateDonation,
  onConfirmDonation,
  onAllocateAtomic,
}: TenantAdminWorkspaceProps) {
  const [caseSearch, setCaseSearch] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>("ALL");
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<MockCase | null>(null);

  // Modals
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showNewDonationModal, setShowNewDonationModal] = useState(false);

  // New Case Form
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [mobile, setMobile] = useState("");
  const [targetType, setTargetType] = useState<"HOUSEHOLD" | "PERSON">(
    mode === "INDIVIDUAL" ? "PERSON" : "HOUSEHOLD"
  );
  const [category, setCategory] = useState<AidCategoryCode>(
    mode === "INDIVIDUAL" ? "MEDICAL_SURGERY" : "MONTHLY_FOOD"
  );
  const [requestedEgp, setRequestedEgp] = useState<number>(
    mode === "INDIVIDUAL" ? 8000 : 4000
  );

  // New Donation Form
  const [donorName, setDonorName] = useState("");
  const [donationType, setDonationType] = useState<"MONETARY" | "IN_KIND">("MONETARY");
  const [restrictedCategory, setRestrictedCategory] = useState<
    AidCategoryCode | "UNRESTRICTED"
  >("UNRESTRICTED");
  const [donationAmount, setDonationAmount] = useState<number>(15000);
  const [donationInitialStatus, setDonationInitialStatus] = useState<
    "CONFIRMED" | "PENDING_VERIFICATION"
  >("CONFIRMED");

  // Atomic Allocation Form
  const confirmedDonations = scopedDonations.filter(
    (d) =>
      (d.status === "CONFIRMED" || d.status === "PARTIALLY_ALLOCATED") &&
      d.availableAmountEgp > 0
  );
  const eligibleCases = scopedCases.filter(
    (c) =>
      c.eligibilityDecision === "ELIGIBLE" || c.eligibilityDecision === "CONDITIONAL"
  );

  const [selectedDonationId, setSelectedDonationId] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [allocationAmount, setAllocationAmount] = useState<number>(3500);

  const activeDonation =
    confirmedDonations.find((d) => d.id === selectedDonationId) ||
    confirmedDonations[0] ||
    null;
  const activeTargetCase =
    eligibleCases.find((c) => c.id === selectedCaseId) || eligibleCases[0] || null;

  const allocationValidation =
    activeDonation && activeTargetCase
      ? validateAllocationRequest({
          donation: activeDonation,
          targetCase: activeTargetCase,
          amountEgp: allocationAmount,
        })
      : null;

  const nidCheck = validateEgyptianNationalId(nationalId);
  const phoneCheck = normalizeAndValidateEgyptianMobile(mobile);

  const filteredCases = scopedCases.filter((c) => {
    const matchesStatus =
      caseStatusFilter === "ALL" ? true : c.caseStatus === caseStatusFilter;
    const q = caseSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.beneficiaryNameAr.toLowerCase().includes(q) ||
      c.caseNumber.toLowerCase().includes(q) ||
      c.categoryAr.toLowerCase().includes(q) ||
      c.householdCode.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName.trim() || !nidCheck.isValid || !phoneCheck.isValid) return;
    onCreateCase({
      tenantId: currentTenant.id,
      beneficiaryNameAr: beneficiaryName.trim(),
      nationalId: nationalId.trim(),
      phoneE164: phoneCheck.e164 || "+201000000000",
      governorate: nidCheck.parsed?.governorateNameAr || currentTenant.governorate,
      targetType,
      category,
      requestedEgp: Number(requestedEgp) || 3000,
    });
    setBeneficiaryName("");
    setShowNewCaseModal(false);
  };

  const handleCreateDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || donationAmount <= 0) return;
    onCreateDonation({
      tenantId: currentTenant.id,
      donorNameAr: donorName.trim(),
      donationType,
      restrictedCategory,
      totalAmountEgp: Number(donationAmount),
      initialStatus: donationInitialStatus,
    });
    setDonorName("");
    setShowNewDonationModal(false);
  };

  const handleRunAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonation || !activeTargetCase) return;
    onAllocateAtomic({
      donationId: activeDonation.id,
      caseId: activeTargetCase.id,
      amountEgp: Number(allocationAmount),
    });
  };

  return (
    <div className="space-y-6">
      {/* Tenant Scope Header & Financial Summary */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
                نطاق المستأجر المعزول ({currentTenant.type})
              </span>
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                عزل كامل للبيانات (Row-Level Tenant Isolation)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{currentTenant.nameAr}</h2>
            <p className="text-xs text-slate-600">
              المحافظة: {currentTenant.governorate}{" "}
              {currentTenant.registrationNumber
                ? `• ${currentTenant.registrationNumber}`
                : "• مبادر فردي مستقل (حساب موثق بالرقم القومي)"}
            </p>
          </div>

          {availableTenantsOfType.length > 1 && (
            <div className="space-y-1">
              <label
                htmlFor="tenant-switcher-select"
                className="block text-xs font-bold text-slate-700"
              >
                تبديل الجهة النشطة ضمن نفس الدور:
              </label>
              <select
                id="tenant-switcher-select"
                value={currentTenant.id}
                onChange={(e) => onSelectTenantId(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold bg-slate-50"
              >
                {availableTenantsOfType.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.status === "ACTIVE" ? "نشط" : "غير مفعل"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">إجمالي التبرعات المؤكدة للجهة</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {currentTenant.confirmedDonationsEgp.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <div className="text-xs text-amber-900">مبالغ محجوزة للتخصيص الذري</div>
            <div className="text-lg font-bold text-amber-900 mt-1">
              {currentTenant.reservedAllocationsEgp.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-900">الرصيد المتاح للتخصيص الفوري</div>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              {currentTenant.availableBalanceEgp.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
        </div>
      </section>

      {/* Cases & Beneficiaries Section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              سجل الحالات ومسارات الحالة الخمسة المعزولة ({filteredCases.length} من أصل{" "}
              {scopedCases.length})
            </h3>
            <p className="text-xs text-slate-600">
              كل حالة تتضمن 5 مسارات مستقلة: حالة الملف، حالة البحث الميداني، قرار الأهلية، حالة التخصيص المالي، وحالة التسليم الفعلي.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCaseModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition"
          >
            + تسجيل حالة / مستفيد جديد بالرقم القومي
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="w-full sm:w-72">
            <label htmlFor="case-search-input" className="sr-only">
              بحث في الحالات
            </label>
            <input
              id="case-search-input"
              type="search"
              placeholder="ابحث باسم المستفيد، رقم الحالة، أو كود الأسرة..."
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "كل الحالات" },
              { id: "NEW", label: "جديد (بانتظار بحث)" },
              { id: "RESEARCH_SUBMITTED", label: "تقرير مرفوع للمشرف" },
              { id: "APPROVED", label: "معتمد الأهلية" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCaseStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  caseStatusFilter === f.id
                    ? "bg-purple-700 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Track Cases Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3">رقم الحالة</th>
                <th className="p-3">المستفيد / الأسرة</th>
                <th className="p-3">البند والمبلغ</th>
                <th className="p-3">حالة الملف (Case)</th>
                <th className="p-3">حالة البحث (Research)</th>
                <th className="p-3">قرار الأهلية</th>
                <th className="p-3">حالة التخصيص</th>
                <th className="p-3">التسليم الفعلي</th>
                <th className="p-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{c.caseNumber}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{c.beneficiaryNameAr}</div>
                    <div className="text-slate-500 font-mono">
                      {c.maskedNationalId} • {c.householdCode}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{c.categoryAr}</div>
                    <div className="text-purple-800 font-bold">
                      {c.requestedEgp.toLocaleString("ar-EG")} ج.م
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold">
                      {c.caseStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">
                      {c.researchStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        c.eligibilityDecision === "ELIGIBLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.eligibilityDecision === "INELIGIBLE"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {c.eligibilityDecision}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 font-semibold">
                      {c.allocationStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {c.deliveryStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCaseForDetails(c)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 font-semibold transition"
                    >
                      التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Case Details Modal */}
      {selectedCaseForDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-details-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {selectedCaseForDetails.caseNumber}
                </span>
                <h3 id="case-details-title" className="text-base font-bold text-slate-900 mt-1">
                  ملف الحالة: {selectedCaseForDetails.beneficiaryNameAr}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                aria-label="إغلاق تفاصيل الحالة"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">الرقم القومي المقنّع:</span>
                <div className="font-mono font-bold text-slate-900">
                  {selectedCaseForDetails.maskedNationalId}
                </div>
              </div>
              <div>
                <span className="text-slate-500">الهاتف الموثق (E.164):</span>
                <div dir="ltr" className="font-mono font-bold text-slate-900 text-right">
                  {selectedCaseForDetails.phoneE164}
                </div>
              </div>
              <div>
                <span className="text-slate-500">الباحث الميداني المكلّف:</span>
                <div className="font-bold text-slate-900">
                  {selectedCaseForDetails.assignedVolunteerAr}
                </div>
              </div>
              <div>
                <span className="text-slate-500">مشرف البحث المعتمد:</span>
                <div className="font-bold text-slate-900">
                  {selectedCaseForDetails.supervisorAr}
                </div>
              </div>
              <div>
                <span className="text-slate-500">دخل الأسرة الشهري:</span>
                <div className="font-bold text-slate-900">
                  {selectedCaseForDetails.householdIncomeEgp.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
              <div>
                <span className="text-slate-500">مصروفات والتزامات الأسرة:</span>
                <div className="font-bold text-rose-800">
                  {selectedCaseForDetails.householdExpensesEgp.toLocaleString("ar-EG")} ج.م
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs space-y-1">
              <div className="font-bold text-purple-950">
                تقرير البحث الميداني (الإصدار v{selectedCaseForDetails.reportVersion}):
              </div>
              <p className="text-slate-800 leading-relaxed">
                {selectedCaseForDetails.researchNotesAr}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCaseForDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-case-modal-title"
        >
          <form
            onSubmit={handleCreateCaseSubmit}
            className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="new-case-modal-title" className="text-base font-bold text-slate-900">
                تسجيل حالة / مستفيد جديد ضمن نطاق ({currentTenant.nameAr})
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCaseModal(false)}
                aria-label="إغلاق نافذة تسجيل حالة"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-case-name" className="block text-xs font-bold text-slate-700">
                اسم المستفيد رباعياً (كما في بطاقة الرقم القومي)
              </label>
              <input
                id="new-case-name"
                type="text"
                required
                placeholder="مثال: نادية عبد الحليم مصطفى"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-case-nid" className="block text-xs font-bold text-slate-700">
                الرقم القومي المصري (14 رقماً)
              </label>
              <input
                id="new-case-nid"
                type="text"
                maxLength={14}
                required
                placeholder="أدخل الـ 14 رقماً للبطاقة"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
              {nationalId && (
                nidCheck.isValid && nidCheck.parsed ? (
                  <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-2">
                    الرقم القومي صحيح — تاريخ الميلاد: <strong>{nidCheck.parsed.birthDateIso}</strong> | المحافظة: <strong>{nidCheck.parsed.governorateNameAr}</strong>
                  </div>
                ) : (
                  <div className="text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-2">
                    {nidCheck.errorAr}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="new-case-mobile" className="block text-xs font-bold text-slate-700">
                  رقم الهاتف المحمول المصري
                </label>
                <input
                  id="new-case-mobile"
                  type="text"
                  required
                  placeholder="010XXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
                {mobile && (
                  phoneCheck.isValid ? (
                    <div className="text-xs text-emerald-700 font-mono">
                      E.164: {phoneCheck.e164}
                    </div>
                  ) : (
                    <div className="text-xs text-rose-700">{phoneCheck.errorAr}</div>
                  )
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-case-target" className="block text-xs font-bold text-slate-700">
                  تصنيف المستفيد
                </label>
                <select
                  id="new-case-target"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as "HOUSEHOLD" | "PERSON")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="HOUSEHOLD">أسرة كاملة (Household)</option>
                  <option value="PERSON">مستفيد فردي (Person)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="new-case-cat" className="block text-xs font-bold text-slate-700">
                  بند المساعدة المطلوبة
                </label>
                <select
                  id="new-case-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AidCategoryCode)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {Object.entries(AID_CATEGORIES_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-case-amount" className="block text-xs font-bold text-slate-700">
                  المبلغ التقديري المطلوب (ج.م)
                </label>
                <input
                  id="new-case-amount"
                  type="number"
                  min={100}
                  step={100}
                  required
                  value={requestedEgp}
                  onChange={(e) => setRequestedEgp(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!nidCheck.isValid || !phoneCheck.isValid}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold disabled:opacity-50"
              >
                تسجيل الملف وإحالته للبحث الاجتماعي
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Donations & Atomic Allocation Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donations Ledger */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                سجل التبرعات والأرصدة المقيدة ({scopedDonations.length})
              </h3>
              <p className="text-xs text-slate-600">
                التبرعات بانتظار التحقق لا تدخل في الرصيد المتاح إلا بعد تأكيد الاستلام المالي.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewDonationModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
            >
              + تسجيل تبرع جديد
            </button>
          </div>

          <div className="space-y-3">
            {scopedDonations.map((don) => (
              <div
                key={don.id}
                className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-800">
                      {don.receiptNumber}
                    </span>
                    <div className="font-bold text-xs text-slate-900">{don.donorNameAr}</div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      don.status === "PENDING_VERIFICATION"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {don.status === "PENDING_VERIFICATION"
                      ? "بانتظار تأكيد الاستلام"
                      : "مؤكد ومتاح للتخصيص"}
                  </span>
                </div>

                <div className="text-xs text-slate-700">
                  <strong>شرط المتبرع:</strong> {don.restrictedCategoryAr}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">الإجمالي</span>
                    <strong className="font-mono">
                      {don.totalAmountEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">محجوز</span>
                    <strong className="font-mono text-amber-800">
                      {don.reservedAmountEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المتاح حالياً</span>
                    <strong className="font-mono text-emerald-800">
                      {don.availableAmountEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                </div>

                {don.status === "PENDING_VERIFICATION" && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onConfirmDonation(don.id)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      تأكيد استلام التبرع وإضافته للرصيد المتاح
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Atomic Financial Allocation Engine */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md">
              Atomic Reservation &amp; Aid Delivery Scheduling
            </span>
            <h3 className="font-bold text-base text-slate-900 mt-1">
              التخصيص المالي الذري وجدولة التسليم الميداني
            </h3>
            <p className="text-xs text-slate-600">
              يتحقق المحرك تلقائياً من مطابقة شرط المتبرع المقيد مع تصنيف الحالة وعدم تجاوز الرصيد المتاح قبل الحجز.
            </p>
          </div>

          <form onSubmit={handleRunAllocation} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="alloc-donation-select"
                className="block text-xs font-bold text-slate-700"
              >
                1. اختر إيصال التبرع المؤكد (المصدر المالي):
              </label>
              <select
                id="alloc-donation-select"
                value={activeDonation?.id || ""}
                onChange={(e) => setSelectedDonationId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
              >
                {confirmedDonations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.receiptNumber} — {d.donorNameAr} (المتاح:{" "}
                    {d.availableAmountEgp.toLocaleString("ar-EG")} ج.م |{" "}
                    {d.restrictedCategory === "UNRESTRICTED" ? "غير مقيد" : d.restrictedCategoryAr})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="alloc-case-select"
                className="block text-xs font-bold text-slate-700"
              >
                2. اختر الحالة المستحقة المعتمدة (المستفيد):
              </label>
              <select
                id="alloc-case-select"
                value={activeTargetCase?.id || ""}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
              >
                {eligibleCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.beneficiaryNameAr} ({c.categoryAr} | مطلوب:{" "}
                    {c.requestedEgp.toLocaleString("ar-EG")} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="alloc-amount-input"
                className="block text-xs font-bold text-slate-700"
              >
                3. مبلغ التخصيص المراد حجزه (ج.م):
              </label>
              <input
                id="alloc-amount-input"
                type="number"
                min={100}
                step={100}
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
            </div>

            {allocationValidation && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  allocationValidation.allowed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="font-bold">
                  {allocationValidation.allowed
                    ? "✓ جاهز للحجز الذري الفوري"
                    : "✕ تنبيه قواعد التخصيص المالي:"}
                </div>
                <div className="mt-0.5">{allocationValidation.reasonAr}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={!allocationValidation?.allowed}
              className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              تنفيذ الحجز المالي الذري وجدولة مهمة التسليم للمتطوع
            </button>
          </form>
        </section>
      </div>

      {/* New Donation Modal */}
      {showNewDonationModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-donation-modal-title"
        >
          <form
            onSubmit={handleCreateDonationSubmit}
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="new-donation-modal-title" className="text-base font-bold text-slate-900">
                تسجيل إيصال تبرع جديد ({currentTenant.nameAr})
              </h3>
              <button
                type="button"
                onClick={() => setShowNewDonationModal(false)}
                aria-label="إغلاق نافذة تسجيل تبرع"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="donor-name-input" className="block text-xs font-bold text-slate-700">
                اسم المتبرع / الجهة المانحة
              </label>
              <input
                id="donor-name-input"
                type="text"
                required
                placeholder="مثال: مؤسسة الخير للتنمية المجتمعية"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="don-type-select" className="block text-xs font-bold text-slate-700">
                  نوع التبرع
                </label>
                <select
                  id="don-type-select"
                  value={donationType}
                  onChange={(e) => setDonationType(e.target.value as "MONETARY" | "IN_KIND")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                >
                  <option value="MONETARY">تبرع نقدي (Monetary)</option>
                  <option value="IN_KIND">تبرع عيني مقوّم (In-Kind)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="don-amount-input" className="block text-xs font-bold text-slate-700">
                  قيمة التبرع (ج.م)
                </label>
                <input
                  id="don-amount-input"
                  type="number"
                  min={100}
                  step={500}
                  required
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="don-restriction-select"
                className="block text-xs font-bold text-slate-700"
              >
                شرط التخصيص (مقيد أم غير مقيد)
              </label>
              <select
                id="don-restriction-select"
                value={restrictedCategory}
                onChange={(e) =>
                  setRestrictedCategory(e.target.value as AidCategoryCode | "UNRESTRICTED")
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
              >
                <option value="UNRESTRICTED">
                  غير مقيد (متاح لكافة مصارف الخير المعتمدة)
                </option>
                {Object.entries(AID_CATEGORIES_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    مقيد لبند: {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="don-status-select" className="block text-xs font-bold text-slate-700">
                حالة التحقق المالي عند الإدراج
              </label>
              <select
                id="don-status-select"
                value={donationInitialStatus}
                onChange={(e) =>
                  setDonationInitialStatus(
                    e.target.value as "CONFIRMED" | "PENDING_VERIFICATION"
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
              >
                <option value="CONFIRMED">مؤكد الاستلام فوراً (يُضاف للرصيد المتاح)</option>
                <option value="PENDING_VERIFICATION">
                  بانتظار مراجعة البنك / الخزينة (PENDING_VERIFICATION)
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewDonationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                حفظ وإصدار إيصال التبرع
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
