"use client";

import React, { useState } from "react";
import {
  AID_CATEGORIES_LABELS,
  type AidCategoryCode,
  type MockTenant,
  type MockCase,
  type MockDelivery,
  type MockConsentItem,
} from "../lib/mock-data/fictional-seed";

interface BeneficiaryPortalWorkspaceProps {
  tenants: MockTenant[];
  cases: MockCase[];
  deliveries: MockDelivery[];
  consents: MockConsentItem[];
  onSubmitBeneficiaryRequest: (payload: {
    tenantId: string;
    category: AidCategoryCode;
    requestedEgp: number;
    notesAr: string;
  }) => void;
  onToggleConsent: (consentId: string) => void;
}

export function BeneficiaryPortalWorkspace({
  tenants,
  cases,
  deliveries,
  consents,
  onSubmitBeneficiaryRequest,
  onToggleConsent,
}: BeneficiaryPortalWorkspaceProps) {
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE");
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    activeTenants[0]?.id || "tenant-assn-noor-tanta"
  );
  const [category, setCategory] = useState<AidCategoryCode>("MONTHLY_FOOD");
  const [requestedEgp, setRequestedEgp] = useState<number>(3500);
  const [notesAr, setNotesAr] = useState<string>(
    "أرغب في التقدم بطلب دعم للأسرة وإرفاق صورة بطاقة الرقم القومي وشهادات قيد الأبناء."
  );

  const [selectedReceiptDelivery, setSelectedReceiptDelivery] =
    useState<MockDelivery | null>(null);

  const verifiedDeliveries = deliveries.filter((d) => d.status === "CONFIRMED");

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesAr.trim()) return;
    onSubmitBeneficiaryRequest({
      tenantId: selectedTenantId,
      category,
      requestedEgp: Number(requestedEgp) || 2500,
      notesAr: notesAr.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Beneficiary Portal Header */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
            بوابة المستفيد الذاتية الآمنة (BENEFICIARY PORTAL)
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            متابعة طلبات المساعدة، إيصالات الاستلام الموثقة، وإدارة خصوصية البيانات
          </h2>
          <p className="text-xs text-slate-600">
            حساب موثق بالرقم القومي المصري (284061216****8) — يمكنك التقديم لدى الجمعيات المعتمدة ومتابعة مراحل فحص الطلب بشفافية كاملة.
          </p>
        </div>
      </section>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Submit New Assistance Request */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              تقديم طلب مساعدة جديد لجمعية أو مبادرة معتمدة
            </h3>
            <p className="text-xs text-slate-600">
              يُنشئ الطلب ملف حالة جديد ويُخطر مشرف البحث الاجتماعي بالجهة المختارة فوراً.
            </p>
          </div>

          <form onSubmit={handleRequestSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="ben-tenant-select"
                className="block text-xs font-bold text-slate-700"
              >
                1. اختر الجمعية الخيرية أو المبادرة المستهدفة:
              </label>
              <select
                id="ben-tenant-select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
              >
                {activeTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr} ({t.governorate})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ben-category-select"
                className="block text-xs font-bold text-slate-700"
              >
                2. نوع المساعدة المطلوبة:
              </label>
              <select
                id="ben-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as AidCategoryCode)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white font-semibold"
              >
                {Object.entries(AID_CATEGORIES_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ben-amount-input"
                className="block text-xs font-bold text-slate-700"
              >
                3. القيمة التقديرية للاحتياج (ج.م):
              </label>
              <input
                id="ben-amount-input"
                type="number"
                min={200}
                step={100}
                required
                value={requestedEgp}
                onChange={(e) => setRequestedEgp(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ben-notes-textarea"
                className="block text-xs font-bold text-slate-700"
              >
                4. شرح مختصر للحالة والمستندات المتوفرة:
              </label>
              <textarea
                id="ben-notes-textarea"
                rows={3}
                required
                value={notesAr}
                onChange={(e) => setNotesAr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition"
            >
              إرسال طلب المساعدة ومتابعة المسار الخماسي
            </button>
          </form>
        </section>

        {/* 5-Step Status Tracker for Requests */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              متابعة مسارات طلباتي الخمسة (5-Axis Case Lifecycle Tracker)
            </h3>
            <p className="text-xs text-slate-600">
              عرض حي لحالة كل طلب عبر المراحل الخمس: قيد الملف، البحث الميداني، الأهلية، التخصيص، والتسليم.
            </p>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {cases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-800">
                      {c.caseNumber}
                    </span>
                    <div className="font-bold text-sm text-slate-900">{c.categoryAr}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    المبلغ المطلوب: {c.requestedEgp.toLocaleString("ar-EG")} ج.م
                  </div>
                </div>

                {/* 5-step visual pills */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">1. الملف</span>
                    <strong className="text-purple-800">{c.caseStatus}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">2. البحث</span>
                    <strong className="text-blue-800">{c.researchStatus}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">3. الأهلية</span>
                    <strong className="text-emerald-800">{c.eligibilityDecision}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">4. التخصيص</span>
                    <strong className="text-amber-800">{c.allocationStatus}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">5. التسليم</span>
                    <strong className="text-slate-900">{c.deliveryStatus}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Verified Aid History & Privacy Consents */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Verified Aid Receipts */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              سجل المساعدات الموثقة المستلمة ({verifiedDeliveries.length})
            </h3>
            <p className="text-xs text-slate-600">
              المساعدات التي تم تأكيد استلامها فعلياً ومطابقتها بمفتاح عدم التكرار.
            </p>
          </div>

          <div className="space-y-3">
            {verifiedDeliveries.map((deliv) => (
              <div
                key={deliv.id}
                className="rounded-xl border border-slate-200 p-3.5 bg-emerald-50/40 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900">
                    {deliv.descriptionAr}
                  </div>
                  <div className="text-xs text-slate-600">
                    رقم الحالة: <span className="font-mono">{deliv.caseNumber}</span> • القيمة:{" "}
                    <strong>{deliv.amountEgp.toLocaleString("ar-EG")} ج.م</strong>
                  </div>
                  <div className="text-xs text-emerald-800">
                    تاريخ الاستلام: {deliv.confirmedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptDelivery(deliv)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition"
                >
                  عرض إيصال الاستلام
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy & Data Sharing Consents */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              إدارة الخصوصية والموافقات الصريحة (Consent Records)
            </h3>
            <p className="text-xs text-slate-600">
              تحكم كامل للمستفيد في صلاحيات مشاركة ملفه الاجتماعي أو الطبي بين الجمعيات الشريكة.
            </p>
          </div>

          <div className="space-y-3">
            {consents.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">{item.titleAr}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.descriptionAr}
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Scope: {item.scopeCode} • آخر تحديث: {item.updatedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleConsent(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    item.granted
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                  }`}
                >
                  {item.granted ? "مفعّل (إلغاء الموافقة)" : "متوقف (منح الموافقة)"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceiptDelivery && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="receipt-modal-title" className="text-base font-bold text-slate-900">
                إيصال استلام مساعدة موثق إلكترونياً
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReceiptDelivery(null)}
                aria-label="إغلاق الإيصال"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الحالة:</span>
                <strong className="font-mono">{selectedReceiptDelivery.caseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم المستفيد:</span>
                <strong>{selectedReceiptDelivery.beneficiaryNameAr}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">البيان:</span>
                <strong>{selectedReceiptDelivery.descriptionAr}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">القيمة المستلمة:</span>
                <strong className="text-emerald-800">
                  {selectedReceiptDelivery.amountEgp.toLocaleString("ar-EG")} ج.م
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مفتاح عدم التكرار:</span>
                <strong className="font-mono">
                  {selectedReceiptDelivery.idempotencyKey}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاريخ التوثيق:</span>
                <strong>{selectedReceiptDelivery.confirmedAt}</strong>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceiptDelivery(null)}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold"
              >
                إغلاق الإيصال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
