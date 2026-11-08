"use client";

import React, { useState } from "react";
import type {
  MockTenant,
  MockCase,
  MockDonation,
  MockSharingRequest,
  MockAuditLog,
  TenantStatus,
} from "../lib/mock-data/fictional-seed";
import type { TargetAuthRole } from "./AuthNationalIdWorkspace";

export interface ManagedUserItem {
  email: string;
  fullNameAr: string;
  maskedNationalId: string;
  phoneE164: string;
  role: TargetAuthRole;
  tenantId: string | null;
  tenantNameAr: string;
  permissionsCount: number;
  updatedAt: string;
}

const ROLE_LABELS_AR: Record<TargetAuthRole, string> = {
  SUPER_ADMIN: "مدير المنصة المركزي (SUPER_ADMIN)",
  ASSOCIATION_ADMIN: "مدير جمعية خيرية (ASSOCIATION_ADMIN)",
  INDIVIDUAL_INITIATIVE: "مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)",
  RESEARCH_SUPERVISOR: "مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)",
  VOLUNTEER: "باحث / متطوع ميداني (VOLUNTEER)",
  BENEFICIARY: "مستفيد (BENEFICIARY)",
};

interface SuperAdminWorkspaceProps {
  tenants: MockTenant[];
  cases: MockCase[];
  donations?: MockDonation[];
  sharingRequests: MockSharingRequest[];
  auditLogs: MockAuditLog[];
  managedUsers?: ManagedUserItem[];
  onUpdateTenantStatus: (tenantId: string, status: TenantStatus) => void;
  onCreateTenant: (newTenant: {
    nameAr: string;
    type: "ASSOCIATION" | "INDIVIDUAL";
    governorate: string;
    registrationNumber?: string;
  }) => void;
  onDecideSharingRequest: (
    requestId: string,
    decision: "APPROVED" | "DENIED"
  ) => void;
  onAssignEmailRole?: (payload: {
    email: string;
    fullNameAr?: string;
    role: TargetAuthRole;
    tenantId?: string | null;
    tenantNameAr?: string | null;
  }) => void;
  onInspectTenantWorkspace?: (tenant: MockTenant) => void;
}

export function SuperAdminWorkspace({
  tenants,
  cases,
  donations = [],
  sharingRequests,
  auditLogs,
  managedUsers = [],
  onUpdateTenantStatus,
  onCreateTenant,
  onDecideSharingRequest,
  onAssignEmailRole,
  onInspectTenantWorkspace,
}: SuperAdminWorkspaceProps) {
  const [tenantFilter, setTenantFilter] = useState<"ALL" | TenantStatus>("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);

  // Interactive Detail Modals for Every Card/Row
  const [selectedTenantDetails, setSelectedTenantDetails] =
    useState<MockTenant | null>(null);
  const [selectedSharingDetails, setSelectedSharingDetails] =
    useState<MockSharingRequest | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] =
    useState<ManagedUserItem | null>(null);
  const [selectedAuditDetails, setSelectedAuditDetails] =
    useState<MockAuditLog | null>(null);

  // Add tenant form states
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantType, setNewTenantType] = useState<
    "ASSOCIATION" | "INDIVIDUAL"
  >("ASSOCIATION");
  const [newTenantGov, setNewTenantGov] = useState("");
  const [newTenantRegNo, setNewTenantRegNo] = useState("");

  // Assign Role by Email states
  const [assignEmailInput, setAssignEmailInput] = useState("");
  const [assignNameInput, setAssignNameInput] = useState("");
  const [assignRoleSelect, setAssignRoleSelect] =
    useState<TargetAuthRole>("ASSOCIATION_ADMIN");
  const [assignTenantIdSelect, setAssignTenantIdSelect] = useState<string>("");
  const [rowSelectedRole, setRowSelectedRole] = useState<
    Record<string, TargetAuthRole>
  >({});

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
  const pendingTenantsCount = tenants.filter(
    (t) => t.status === "PENDING_APPROVAL"
  ).length;

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

  const handleAssignEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = assignEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;
    const matchedTenant = tenants.find((t) => t.id === assignTenantIdSelect);

    onAssignEmailRole?.({
      email: cleanEmail,
      fullNameAr: assignNameInput.trim() || undefined,
      role: assignRoleSelect,
      tenantId: matchedTenant?.id || null,
      tenantNameAr: matchedTenant?.nameAr || null,
    });
    setAssignEmailInput("");
    setAssignNameInput("");
  };

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Fresh live reference if selectedTenantDetails is open
  const activeModalTenant = selectedTenantDetails
    ? tenants.find((t) => t.id === selectedTenantDetails.id) ||
      selectedTenantDetails
    : null;
  const activeModalTenantCases = activeModalTenant
    ? cases.filter((c) => c.tenantId === activeModalTenant.id)
    : [];
  const activeModalTenantDonations = activeModalTenant
    ? donations.filter((d) => d.tenantId === activeModalTenant.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Platform Overview Banner & Clickable KPIs */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-md">
              لوحة الحوكمة المركزية (SUPER_ADMIN) • الحساب المعتمد: eng.mhashim@gmail.com
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              إدارة المنصة، تعيين أدوار المستخدمين، واعتماد الجمعيات والمبادرات
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              اضغط على أي جمعية خيرية، مستخدم، أو طلب مشاركة لعرض بطاقة التفاصيل الكاملة الخاصة به.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("section-user-roles")}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer transition"
            >
              إدارة وتعيين أدوار المستخدمين ({managedUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setShowAddTenantModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm cursor-pointer transition"
            >
              + إضافة جهة خيرية أو مبادرة جديدة
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          <button
            type="button"
            onClick={() => {
              setTenantFilter("ALL");
              scrollToSection("section-tenants-table");
            }}
            className="bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 cursor-pointer transition text-center"
          >
            <div className="text-xs text-slate-600">إجمالي الجهات والمبادرات</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {tenants.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setTenantFilter("PENDING_APPROVAL");
              scrollToSection("section-tenants-table");
            }}
            className="bg-amber-50 hover:bg-amber-100 p-3.5 rounded-xl border border-amber-200 cursor-pointer transition text-center"
          >
            <div className="text-xs text-amber-900">جهات بانتظار الاعتماد</div>
            <div className="text-lg font-bold text-amber-900 mt-1">
              {pendingTenantsCount}
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-tenants-table")}
            className="bg-purple-50 hover:bg-purple-100 p-3.5 rounded-xl border border-purple-200 cursor-pointer transition text-center"
          >
            <div className="text-xs text-purple-900">إجمالي الحالات المسجلة</div>
            <div className="text-lg font-bold text-purple-900 mt-1">
              {cases.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-tenants-table")}
            className="bg-emerald-50 hover:bg-emerald-100 p-3.5 rounded-xl border border-emerald-200 cursor-pointer transition text-center"
          >
            <div className="text-xs text-emerald-900">إجمالي التبرعات المؤكدة</div>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              {totalConfirmedDonations.toLocaleString("ar-EG")} ج.م
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-audit-logs")}
            className="bg-blue-50 hover:bg-blue-100 p-3.5 rounded-xl border border-blue-200 cursor-pointer transition text-center"
          >
            <div className="text-xs text-blue-900">سجلات التدقيق الأمني</div>
            <div className="text-lg font-bold text-blue-900 mt-1">
              {auditLogs.length}
            </div>
          </button>
        </div>
      </section>

      {/* Clickable Charity / Initiative Cards + Table */}
      <section
        id="section-tenants-table"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              الجمعيات الخيرية والمبادرات المسجلة ({filteredTenants.length}) — اضغط على أي بطاقة لعرض كافة التفاصيل
            </h3>
            <p className="text-xs text-slate-600">
              انقر على أي جمعية أو مبادرة لفتح ملفها الكامل (الحالات، التبرعات، الأرصدة، وإجراءات الاعتماد).
            </p>
          </div>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
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

        {/* Interactive Clickable Charity Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              onClick={() => setSelectedTenantDetails(tenant)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedTenantDetails(tenant);
                }
              }}
              className="group rounded-2xl border border-slate-200 hover:border-purple-400 bg-slate-50/70 hover:bg-purple-50/30 p-4 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[11px] font-bold">
                      {tenant.type === "ASSOCIATION"
                        ? "جمعية خيرية مشهرة"
                        : "مبادرة فردية مستقلة"}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-purple-800 mt-1">
                      {tenant.nameAr}
                    </h4>
                  </div>
                  <div>
                    {tenant.status === "ACTIVE" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        نشط ومعتمد
                      </span>
                    )}
                    {tenant.status === "PENDING_APPROVAL" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                        بانتظار الاعتماد
                      </span>
                    )}
                    {tenant.status === "SUSPENDED" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        موقوف مؤقتاً
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  المحافظة: <strong>{tenant.governorate}</strong>{" "}
                  {tenant.registrationNumber
                    ? `• الإشهار: ${tenant.registrationNumber}`
                    : "• مبادر فردي موثق"}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">الحالات</span>
                    <strong className="font-mono text-purple-900">
                      {tenant.activeCasesCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">إجمالي التبرعات</span>
                    <strong className="font-mono text-slate-900">
                      {tenant.confirmedDonationsEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">الرصيد المتاح</span>
                    <strong className="font-mono text-emerald-800">
                      {tenant.availableBalanceEgp.toLocaleString("ar-EG")} ج.م
                    </strong>
                  </div>
                </div>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTenantDetails(tenant)}
                  className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold cursor-pointer transition"
                >
                  عرض كافة التفاصيل ({tenant.activeCasesCount} حالة)
                </button>

                <div className="flex items-center gap-1.5">
                  {onInspectTenantWorkspace && (
                    <button
                      type="button"
                      onClick={() => onInspectTenantWorkspace(tenant)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition"
                    >
                      فتح مساحة العمل
                    </button>
                  )}
                  {tenant.status !== "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => onUpdateTenantStatus(tenant.id, "ACTIVE")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
                    >
                      اعتماد وتفعيل
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateTenantStatus(tenant.id, "SUSPENDED")
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer transition"
                    >
                      إيقاف مؤقت
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role & Permission Assignment by Email (Controlled Exclusively by Super Admin) */}
      <section
        id="section-user-roles"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5"
      >
        <div>
          <span className="text-xs font-semibold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md">
            صلاحية حصرية لمدير المنصة (Super Admin Role Assignment)
          </span>
          <h3 className="font-bold text-base text-slate-900 mt-1">
            تعيين الأدوار والصلاحيات للمستخدمين حسب البريد الإلكتروني
          </h3>
          <p className="text-xs text-slate-600">
            اضغط على أي مستخدم في الجدول لعرض بطاقة بياناته وصلاحياته الكاملة، أو قم بتعديل دوره مباشرة.
          </p>
        </div>

        {/* Form to pre-assign or update role for any email */}
        <form
          onSubmit={handleAssignEmailSubmit}
          className="bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-3 space-y-1">
            <label
              htmlFor="assign-email-input"
              className="block text-xs font-bold text-slate-700"
            >
              البريد الإلكتروني للمستخدم *
            </label>
            <input
              id="assign-email-input"
              type="email"
              dir="ltr"
              required
              placeholder="user@domain.com"
              value={assignEmailInput}
              onChange={(e) => setAssignEmailInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label
              htmlFor="assign-name-input"
              className="block text-xs font-bold text-slate-700"
            >
              الاسم (اختياري للتوضيح)
            </label>
            <input
              id="assign-name-input"
              type="text"
              placeholder="اسم المستخدم"
              value={assignNameInput}
              onChange={(e) => setAssignNameInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label
              htmlFor="assign-role-select"
              className="block text-xs font-bold text-slate-700"
            >
              الدور الوظيفي والصلاحيات *
            </label>
            <select
              id="assign-role-select"
              value={assignRoleSelect}
              onChange={(e) =>
                setAssignRoleSelect(e.target.value as TargetAuthRole)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white cursor-pointer"
            >
              <option value="ASSOCIATION_ADMIN">
                مدير جمعية خيرية (ASSOCIATION_ADMIN)
              </option>
              <option value="INDIVIDUAL_INITIATIVE">
                مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)
              </option>
              <option value="RESEARCH_SUPERVISOR">
                مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
              </option>
              <option value="VOLUNTEER">باحث / متطوع ميداني (VOLUNTEER)</option>
              <option value="BENEFICIARY">مستفيد (BENEFICIARY)</option>
              <option value="SUPER_ADMIN">
                مدير المنصة المركزي (SUPER_ADMIN)
              </option>
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2">
            {(assignRoleSelect === "ASSOCIATION_ADMIN" ||
              assignRoleSelect === "INDIVIDUAL_INITIATIVE") && (
              <select
                aria-label="الجهة التابع لها"
                value={assignTenantIdSelect}
                onChange={(e) => setAssignTenantIdSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs bg-white cursor-pointer"
              >
                <option value="">اختر الجمعية / المبادرة (اختياري)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameAr}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm cursor-pointer transition"
            >
              تعيين الدور وحفظ الصلاحيات
            </button>
          </div>
        </form>

        {/* Registered Users & Email Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3">المستخدم</th>
                <th className="p-3">البريد الإلكتروني</th>
                <th className="p-3">الرقم القومي / الهاتف</th>
                <th className="p-3">الدور الحالي والصلاحيات</th>
                <th className="p-3">النطاق / الجهة</th>
                <th className="p-3">تعديل الدور أو عرض التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((u) => {
                const selectedRoleForRow = rowSelectedRole[u.email] || u.role;
                return (
                  <tr
                    key={u.email}
                    onClick={() => setSelectedUserDetails(u)}
                    className="border-b border-slate-100 hover:bg-purple-50/40 cursor-pointer transition"
                  >
                    <td className="p-3 font-bold text-slate-900">
                      {u.fullNameAr}
                    </td>
                    <td className="p-3 font-mono text-purple-900 font-semibold">
                      {u.email}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      <div>{u.maskedNationalId}</div>
                      <div dir="ltr" className="text-right text-[11px]">
                        {u.phoneE164}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                        {ROLE_LABELS_AR[u.role] || u.role}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {u.permissionsCount} صلاحية مفعّلة
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{u.tenantNameAr}</td>
                    <td
                      className="p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`تغيير دور ${u.email}`}
                          value={selectedRoleForRow}
                          onChange={(e) =>
                            setRowSelectedRole((prev) => ({
                              ...prev,
                              [u.email]: e.target.value as TargetAuthRole,
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-semibold cursor-pointer"
                        >
                          <option value="SUPER_ADMIN">مدير المنصة</option>
                          <option value="ASSOCIATION_ADMIN">مدير جمعية</option>
                          <option value="INDIVIDUAL_INITIATIVE">
                            مبادر فردي
                          </option>
                          <option value="RESEARCH_SUPERVISOR">
                            مشرف بحث اجتماعي
                          </option>
                          <option value="VOLUNTEER">باحث / متطوع</option>
                          <option value="BENEFICIARY">مستفيد</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onAssignEmailRole?.({
                              email: u.email,
                              fullNameAr: u.fullNameAr,
                              role: selectedRoleForRow,
                              tenantId: u.tenantId,
                              tenantNameAr: u.tenantNameAr,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer transition"
                        >
                          تحديث الدور
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetails(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold cursor-pointer transition"
                        >
                          التفاصيل
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cross-Tenant Data Sharing Governance (Clickable Cards) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            طلبات مشاركة البيانات بين الجهات — اضغط على أي بطاقة لعرض تفاصيلها
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            لا يتم كشف بيانات أي مستفيد بين جهتين إلا بعد موافقة المستفيد الصريحة واعتماد طلب المشاركة لمنع ازدواج الصرف.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {sharingRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedSharingDetails(req)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSharingDetails(req);
                }
              }}
              className="rounded-xl border border-slate-200 hover:border-purple-400 p-4 bg-slate-50/70 hover:bg-purple-50/30 space-y-2.5 flex flex-col justify-between cursor-pointer transition shadow-sm"
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

              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSharingDetails(req)}
                  className="px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold cursor-pointer transition"
                >
                  عرض تفاصيل الطلب
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDecideSharingRequest(req.id, "APPROVED")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
                  >
                    موافقة على المشاركة
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecideSharingRequest(req.id, "DENIED")}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer transition"
                  >
                    رفض الطلب
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Immutable Security & Governance Audit Trail (Clickable Rows) */}
      <section
        id="section-audit-logs"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              سجل التدقيق الأمني الشامل — اضغط على أي سجل لعرض تفاصيله الكاملة
            </h3>
            <p className="text-xs text-slate-600">
              يوثق جميع قرارات الأهلية، تعيين الأدوار، التخصيصات الذرية، وتأكيدات التسليم الميداني لحظياً.
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
                <th className="p-2.5">النطاق</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedAuditDetails(log)}
                  className="border-b border-slate-100 hover:bg-purple-50/40 cursor-pointer transition"
                >
                  <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">
                      {log.actorNameAr}
                    </div>
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

      {/* ===================================================================== */}
      {/* MODAL 1: Charity / Initiative Full Details Modal                      */}
      {/* ===================================================================== */}
      {activeModalTenant && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTenantDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-xs font-bold">
                    {activeModalTenant.type === "ASSOCIATION"
                      ? "جمعية خيرية مشهرة"
                      : "مبادرة فردية مستقلة"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeModalTenant.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeModalTenant.status === "PENDING_APPROVAL"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {activeModalTenant.status === "ACTIVE"
                      ? "نشط ومعتمد"
                      : activeModalTenant.status === "PENDING_APPROVAL"
                      ? "بانتظار الاعتماد"
                      : "موقوف مؤقتاً"}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1.5">
                  {activeModalTenant.nameAr}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  المحافظة: {activeModalTenant.governorate} •{" "}
                  {activeModalTenant.registrationNumber || "مبادرة فردية مسجلة"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantDetails(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕ إغلاق
              </button>
            </div>

            {/* Financial & Cases KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">عدد الحالات المسجلة</span>
                <strong className="text-base font-bold text-purple-900 mt-1 block">
                  {activeModalTenantCases.length} حالة
                </strong>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-900 block">إجمالي التبرعات المؤكدة</span>
                <strong className="text-base font-bold text-emerald-900 mt-1 block">
                  {activeModalTenant.confirmedDonationsEgp.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-amber-900 block">مبالغ محجوزة للحالات</span>
                <strong className="text-base font-bold text-amber-900 mt-1 block">
                  {activeModalTenant.reservedAllocationsEgp.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="text-blue-900 block">الرصيد المتاح حالياً</span>
                <strong className="text-base font-bold text-blue-900 mt-1 block">
                  {activeModalTenant.availableBalanceEgp.toLocaleString(
                    "ar-EG"
                  )}{" "}
                  ج.م
                </strong>
              </div>
            </div>

            {/* Registered Cases under this Charity */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900">
                الحالات المسجلة لدى هذه الجهة ({activeModalTenantCases.length}):
              </h4>
              {activeModalTenantCases.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  لا توجد حالات مسجلة لدى هذه الجهة حتى الآن.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2.5">رقم الحالة</th>
                        <th className="p-2.5">المستفيد</th>
                        <th className="p-2.5">البند</th>
                        <th className="p-2.5">المبلغ المطلوب</th>
                        <th className="p-2.5">الأهلية</th>
                        <th className="p-2.5">حالة التسليم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModalTenantCases.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-2.5 font-mono font-bold">
                            {c.caseNumber}
                          </td>
                          <td className="p-2.5 font-bold">
                            {c.beneficiaryNameAr}
                          </td>
                          <td className="p-2.5">{c.categoryAr}</td>
                          <td className="p-2.5 font-mono">
                            {c.requestedEgp.toLocaleString("ar-EG")} ج.م
                          </td>
                          <td className="p-2.5 font-bold text-emerald-800">
                            {c.eligibilityDecision}
                          </td>
                          <td className="p-2.5">{c.deliveryStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Donations under this Charity */}
            {activeModalTenantDonations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900">
                  سجل التبرعات المسجلة للجهة ({activeModalTenantDonations.length}):
                </h4>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2">رقم الإيصال</th>
                        <th className="p-2">المتبرع</th>
                        <th className="p-2">الشرط</th>
                        <th className="p-2">الإجمالي</th>
                        <th className="p-2">المتاح</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModalTenantDonations.map((d) => (
                        <tr key={d.id} className="border-b border-slate-100">
                          <td className="p-2 font-mono font-bold">
                            {d.receiptNumber}
                          </td>
                          <td className="p-2 font-bold">{d.donorNameAr}</td>
                          <td className="p-2">{d.restrictedCategoryAr}</td>
                          <td className="p-2 font-mono">
                            {d.totalAmountEgp.toLocaleString("ar-EG")} ج.م
                          </td>
                          <td className="p-2 font-mono text-emerald-800 font-bold">
                            {d.availableAmountEgp.toLocaleString("ar-EG")} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                {activeModalTenant.status !== "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTenantStatus(activeModalTenant.id, "ACTIVE")
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
                  >
                    اعتماد وتفعيل الجهة الآن
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTenantStatus(activeModalTenant.id, "SUSPENDED")
                    }
                    className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer transition"
                  >
                    إيقاف مؤقت للجهة
                  </button>
                )}

                {onInspectTenantWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeModalTenant;
                      setSelectedTenantDetails(null);
                      onInspectTenantWorkspace(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer transition"
                  >
                    الانتقال إلى مساحة عمل هذه الجهة ←
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedTenantDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: User Profile & Role Permissions Details Modal                */}
      {/* ===================================================================== */}
      {selectedUserDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedUserDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  بطاقة بيانات المستخدم والصلاحيات: {selectedUserDetails.fullNameAr}
                </h3>
                <p className="text-xs font-mono text-purple-800">
                  {selectedUserDetails.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">الدور الوظيفي المعتمد:</span>
                <strong className="text-emerald-800">
                  {ROLE_LABELS_AR[selectedUserDetails.role]}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">النطاق / الجهة:</span>
                <strong className="text-slate-900">
                  {selectedUserDetails.tenantNameAr}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">الرقم القومي المقنّع:</span>
                <strong className="font-mono text-slate-900">
                  {selectedUserDetails.maskedNationalId}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">رقم الهاتف المحمول:</span>
                <strong dir="ltr" className="font-mono text-slate-900">
                  {selectedUserDetails.phoneE164}
                </strong>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: Data Sharing Request Details Modal                           */}
      {/* ===================================================================== */}
      {selectedSharingDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedSharingDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                تفاصيل طلب مشاركة ملف المستفيد: {selectedSharingDetails.beneficiaryNameAr}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSharingDetails(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">الرقم القومي المقنّع للمستفيد: </span>
                <strong className="font-mono">
                  {selectedSharingDetails.maskedNationalId}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">الجهة الطالبة للاطلاع: </span>
                <strong>{selectedSharingDetails.requestingTenantNameAr}</strong>
              </div>
              <div>
                <span className="text-slate-500">الجهة المالكة للملف الأصلي: </span>
                <strong>{selectedSharingDetails.owningTenantNameAr}</strong>
              </div>
              <div>
                <span className="text-slate-500">نطاق البيانات المطلوب مشاركته: </span>
                <p className="font-semibold text-slate-900 mt-1">
                  {selectedSharingDetails.scopeAr}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDecideSharingRequest(
                      selectedSharingDetails.id,
                      "APPROVED"
                    );
                    setSelectedSharingDetails(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  موافقة على المشاركة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDecideSharingRequest(selectedSharingDetails.id, "DENIED");
                    setSelectedSharingDetails(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer"
                >
                  رفض الطلب
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSharingDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: Audit Log Entry Details Modal                                */}
      {/* ===================================================================== */}
      {selectedAuditDetails && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedAuditDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                تفاصيل سجل التدقيق الأمني
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAuditDetails(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">التوقيت:</span>
                <strong className="font-mono">
                  {selectedAuditDetails.timestamp}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المنفّذ:</span>
                <strong>{selectedAuditDetails.actorNameAr}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الدور الوظيفي:</span>
                <strong>{selectedAuditDetails.actorRoleAr}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">كود العملية:</span>
                <strong className="font-mono text-purple-800">
                  {selectedAuditDetails.actionCode}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">النطاق / الجهة:</span>
                <strong>{selectedAuditDetails.tenantNameAr}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">وصف العملية:</span>
                <p className="font-bold text-slate-900 mt-1">
                  {selectedAuditDetails.descriptionAr}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditDetails(null)}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

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
              <h3
                id="add-tenant-modal-title"
                className="text-base font-bold text-slate-900"
              >
                إدراج جمعية خيرية أو مبادرة فردية جديدة
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTenantModal(false)}
                aria-label="إغلاق نافذة إضافة جهة"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tenant-name-input"
                className="block text-xs font-bold text-slate-700"
              >
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
                <label
                  htmlFor="tenant-type-select"
                  className="block text-xs font-bold text-slate-700"
                >
                  نوع الكيان القانوني
                </label>
                <select
                  id="tenant-type-select"
                  value={newTenantType}
                  onChange={(e) =>
                    setNewTenantType(
                      e.target.value as "ASSOCIATION" | "INDIVIDUAL"
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white cursor-pointer"
                >
                  <option value="ASSOCIATION">جمعية / مؤسسة خيرية مشهرة</option>
                  <option value="INDIVIDUAL">مبادرة فردية مستقلة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="tenant-gov-input"
                  className="block text-xs font-bold text-slate-700"
                >
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
                <label
                  htmlFor="tenant-reg-input"
                  className="block text-xs font-bold text-slate-700"
                >
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
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                حفظ وإدراج للمراجعة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
