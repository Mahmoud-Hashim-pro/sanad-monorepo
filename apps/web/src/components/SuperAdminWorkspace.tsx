"use client";

import React, { useState } from "react";
import type {
  MockTenant,
  MockCase,
  MockSharingRequest,
  MockAuditLog,
  TenantStatus,
} from "../lib/mock-data/fictional-seed";

interface SuperAdminWorkspaceProps {
  tenants: MockTenant[];
  cases: MockCase[];
  sharingRequests: MockSharingRequest[];
  auditLogs: MockAuditLog[];
  onUpdateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  onCreateTenant: (newTenant: {
    nameAr: string;
    type: "ASSOCIATION" | "INDIVIDUAL";
    governorate: string;
    registrationNumber?: string;
  }) => void;
  onDecideSharingRequest: (requestId: string, decision: "APPROVED" | "DENIED") => void;
}

export function SuperAdminWorkspace({
  tenants,
  cases,
  sharingRequests,
  auditLogs,
  onUpdateTenantStatus,
  onCreateTenant,
  onDecideSharingRequest,
}: SuperAdminWorkspaceProps) {
  const [tenantFilter, setTenantFilter] = useState<"ALL" | TenantStatus>("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);

  // Add tenant form states
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantType, setNewTenantType] = useState<"ASSOCIATION" | "INDIVIDUAL">("ASSOCIATION");
  const [newTenantGov, setNewTenantGov] = useState("القاهرة");
  const [newTenantRegNo, setNewTenantRegNo] = useState("مشهـرة برقم 6120 لسنة 2024 - القاهرة");

  const filteredTenants = tenants.filter((t) =>
    tenantFilter === "ALL" ? true : t.status === tenantFilter
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      log.descriptionAr.toLowerCase().includes(q) ||
      log.actorNameAr.toLowerCase().includes(q) ||
      log.actionCode.toLowerCase().includes(q) ||
      log.tenantNameAr.toLowerCase().includes(q)
    );
  });

  const totalConfirmedDonations = tenants.reduce(
    (sum, t) => sum + t.confirmedDonationsEgp,
    0
  );
  const pendingTenantsCount = tenants.filter((t) => t.status === "PENDING_APPROVAL").length;

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    onCreateTenant({
      nameAr: newTenantName.trim(),
      type: newTenantType,
      governorate: newTenantGov.trim() || "القاهرة",
      registrationNumber:
        newTenantType === "ASSOCIATION" ? newTenantRegNo.trim() : undefined,
    });
    setNewTenantName("");
    setShowAddTenantModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Platform Overview Banner & KPIs */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
              لوحة الحوكمة المركزية (SUPER_ADMIN) • الحساب المعتمد: eng.mhashim@gmail.com
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              إدارة المنصة واعتماد الجمعيات الخيرية والمبادرات الفردية
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              مراقبة عزل البيانات بين المستأجرين، اعتماد تراخيص التضامن الاجتماعي، وإدارة طلبات المشاركة البينية المشفرة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTenantModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition"
          >
            + إضافة جهة خيرية أو مبادرة جديدة
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">إجمالي الجهات والمبادرات</div>
            <div className="text-lg font-bold text-slate-900 mt-1">{tenants.length}</div>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
            <div className="text-xs text-amber-900">جهات بانتظار الاعتماد</div>
            <div className="text-lg font-bold text-amber-900 mt-1">{pendingTenantsCount}</div>
          </div>
          <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
            <div className="text-xs text-purple-900">إجمالي الحالات المسجلة</div>
            <div className="text-lg font-bold text-purple-900 mt-1">{cases.length}</div>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-900">إجمالي التبرعات المؤكدة</div>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              {totalConfirmedDonations.toLocaleString("ar-EG")} ج.م
            </div>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
            <div className="text-xs text-blue-900">سجلات التدقيق الأمني</div>
            <div className="text-lg font-bold text-blue-900 mt-1">{auditLogs.length}</div>
          </div>
        </div>
      </section>

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-tenant-modal-title"
        >
          <form
            onSubmit={handleCreateTenantSubmit}
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 id="add-tenant-modal-title" className="text-base font-bold text-slate-900">
                إدراج جمعية خيرية أو مبادرة فردية جديدة
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTenantModal(false)}
                aria-label="إغلاق نافذة إضافة جهة"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tenant-name-input" className="block text-xs font-bold text-slate-700">
                اسم الجمعية الخيرية أو المبادرة الفردية
              </label>
              <input
                id="tenant-name-input"
                type="text"
                required
                placeholder="مثال: جمعية الإحسان لرعاية الأيتام بالمنيا"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="tenant-type-select" className="block text-xs font-bold text-slate-700">
                  نوع الكيان القانوني
                </label>
                <select
                  id="tenant-type-select"
                  value={newTenantType}
                  onChange={(e) =>
                    setNewTenantType(e.target.value as "ASSOCIATION" | "INDIVIDUAL")
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="ASSOCIATION">جمعية / مؤسسة خيرية مشهرة</option>
                  <option value="INDIVIDUAL">مبادرة فردية مستقلة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tenant-gov-input" className="block text-xs font-bold text-slate-700">
                  المحافظة
                </label>
                <input
                  id="tenant-gov-input"
                  type="text"
                  required
                  value={newTenantGov}
                  onChange={(e) => setNewTenantGov(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            {newTenantType === "ASSOCIATION" && (
              <div className="space-y-1.5">
                <label htmlFor="tenant-reg-input" className="block text-xs font-bold text-slate-700">
                  رقم وتاريخ الإشهار بوزارة التضامن الاجتماعي
                </label>
                <input
                  id="tenant-reg-input"
                  type="text"
                  value={newTenantRegNo}
                  onChange={(e) => setNewTenantRegNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTenantModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold"
              >
                حفظ وإدراج للمراجعة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Approval & Lifecycle Table */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-base text-slate-900">
            إدارة واعتماد الجهات الخيرية والمبادرات ({filteredTenants.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "الكل" },
              { id: "PENDING_APPROVAL", label: "بانتظار الاعتماد" },
              { id: "ACTIVE", label: "نشط" },
              { id: "SUSPENDED", label: "موقوف مؤقتاً" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTenantFilter(f.id as "ALL" | TenantStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tenantFilter === f.id
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3">اسم الجهة / المبادرة</th>
                <th className="p-3">النوع</th>
                <th className="p-3">المحافظة / الإشهار</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الرصيد المتاح</th>
                <th className="p-3">إجراءات الاعتماد والرقابة</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{tenant.nameAr}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-medium">
                      {tenant.type === "ASSOCIATION" ? "جمعية مشهرة" : "مبادرة فردية"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {tenant.governorate}{" "}
                    {tenant.registrationNumber ? `• ${tenant.registrationNumber}` : "• مبادر فردي"}
                  </td>
                  <td className="p-3">
                    {tenant.status === "ACTIVE" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        نشط ومعتمد
                      </span>
                    )}
                    {tenant.status === "PENDING_APPROVAL" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                        بانتظار الاعتماد
                      </span>
                    )}
                    {tenant.status === "SUSPENDED" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                        موقوف مؤقتاً
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {tenant.availableBalanceEgp.toLocaleString("ar-EG")} ج.م
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {tenant.status !== "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateTenantStatus(tenant.id, "ACTIVE")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                        >
                          اعتماد وتفعيل الجهة
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateTenantStatus(tenant.id, "SUSPENDED")}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition"
                        >
                          إيقاف مؤقت
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cross-Tenant Data Sharing Governance */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            طلبات مشاركة البيانات بين الجهات (Cross-Tenant Data SharingGrants)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            لا يتم كشف بيانات أي مستفيد بين جهتين إلا بعد موافقة المستفيد الصريحة واعتماد طلب المشاركة لمنع ازدواج الصرف.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sharingRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    المستفيد: {req.beneficiaryNameAr}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      req.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "DENIED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {req.status === "APPROVED"
                      ? "تمت الموافقة"
                      : req.status === "DENIED"
                      ? "مرفوض"
                      : "قيد المراجعة"}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong>الجهة الطالبة:</strong> {req.requestingTenantNameAr}
                </div>
                <div className="text-xs text-slate-600">
                  <strong>الجهة المالكة للملف:</strong> {req.owningTenantNameAr}
                </div>
                <div className="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2">
                  <strong>نطاق المشاركة المطلوب:</strong> {req.scopeAr}
                </div>
              </div>

              {req.status === "PENDING" && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onDecideSharingRequest(req.id, "APPROVED")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    موافقة على المشاركة
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecideSharingRequest(req.id, "DENIED")}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition"
                  >
                    رفض الطلب
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Immutable Security & Governance Audit Trail */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              سجل التدقيق الأمني الشامل (Immutable Audit Logs)
            </h3>
            <p className="text-xs text-slate-600">
              يوثق جميع قرارات الأهلية، التخصيصات الذرية، وتأكيدات التسليم الميداني لحظياً.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="audit-search-input" className="sr-only">
              بحث في سجل التدقيق الأمني
            </label>
            <input
              id="audit-search-input"
              type="search"
              placeholder="ابحث في السجل (اسم، كود عملية، جهة)..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2.5">التوقيت</th>
                <th className="p-2.5">المنفّذ والدور</th>
                <th className="p-2.5">كود العملية</th>
                <th className="p-2.5">التفاصيل</th>
                <th className="p-2.5">النطاق (Tenant)</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">{log.actorNameAr}</div>
                    <div className="text-slate-500">{log.actorRoleAr}</div>
                  </td>
                  <td className="p-2.5 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-purple-800 font-semibold">
                      {log.actionCode}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-800">{log.descriptionAr}</td>
                  <td className="p-2.5 text-slate-600">{log.tenantNameAr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
