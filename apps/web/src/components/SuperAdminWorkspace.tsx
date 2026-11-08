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
import { BeneficiarySearchBar } from "./BeneficiarySearchBar";
import { Beneficiary360Modal } from "./Beneficiary360Modal";
import {
  type Beneficiary360Profile,
  INITIAL_BENEFICIARIES_PROFILES,
  findOrCreateBeneficiaryProfile,
} from "../lib/mock-data/beneficiaries-data";
import {
  ROLE_LABELS_AR,
  ROLE_PERMISSIONS_MAP,
  PERMISSION_DESCRIPTIONS_AR,
  ROLE_GUIDE_ITEMS_AR,
  type RoleGuideItem,
} from "../lib/domain/sanad-rules";

export interface ManagedUserItem {
  email: string;
  fullNameAr: string;
  maskedNationalId: string;
  phoneE164: string;
  role: TargetAuthRole;
  tenantId: string | null;
  tenantNameAr: string;
  permissionsCount: number;
  permissions?: string[];
  status?: string;
  hasPassword?: boolean;
  updatedAt: string;
}

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
    password?: string;
    nationalId?: string;
    phone?: string;
  }) => void;
  onInspectTenantWorkspace?: (tenant: MockTenant) => void;
  beneficiaryProfiles?: Beneficiary360Profile[];
  onSelectBeneficiary?: (profile: Beneficiary360Profile) => void;
  onUpdateBeneficiaryProfile?: (updated: Beneficiary360Profile) => void;
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
  beneficiaryProfiles,
  onSelectBeneficiary,
  onUpdateBeneficiaryProfile,
}: SuperAdminWorkspaceProps) {
  const [tenantFilter, setTenantFilter] = useState<"ALL" | TenantStatus>("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);

  // Beneficiary 360 State & Search Handler
  const [internalBeneficiaryModal, setInternalBeneficiaryModal] =
    useState<Beneficiary360Profile | null>(null);

  const activeBeneficiaryList = beneficiaryProfiles || INITIAL_BENEFICIARIES_PROFILES;

  const handleOpenBeneficiaryProfile = (target: {
    nationalId?: string;
    phone?: string;
    name?: string;
    email?: string;
  }) => {
    const profile = findOrCreateBeneficiaryProfile(target, activeBeneficiaryList);
    if (onSelectBeneficiary && profile) {
      onSelectBeneficiary(profile);
    } else if (profile) {
      setInternalBeneficiaryModal(profile);
    }
  };

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

  // Assign Role & User Provisioning states
  const [assignEmailInput, setAssignEmailInput] = useState("");
  const [assignNameInput, setAssignNameInput] = useState("");
  const [assignPasswordInput, setAssignPasswordInput] = useState("");
  const [showAssignPassword, setShowAssignPassword] = useState(false);
  const [assignNationalIdInput, setAssignNationalIdInput] = useState("");
  const [assignPhoneInput, setAssignPhoneInput] = useState("");
  const [assignRoleSelect, setAssignRoleSelect] =
    useState<TargetAuthRole>("ASSOCIATION_ADMIN");
  const [assignTenantIdSelect, setAssignTenantIdSelect] = useState<string>("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Reset Password Modal State
  const [resetPasswordModalUser, setResetPasswordModalUser] =
    useState<ManagedUserItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Inside Selected User Details Modal State
  const [modalNewPasswordInput, setModalNewPasswordInput] = useState("");
  const [showModalNewPassword, setShowModalNewPassword] = useState(false);
  const [activeRoleGuideTab, setActiveRoleGuideTab] =
    useState<TargetAuthRole>("SUPER_ADMIN");

  const [rowSelectedRole, setRowSelectedRole] = useState<
    Record<string, TargetAuthRole>
  >({});

  const generateRandomStrongPassword = () => {
    const chars =
      "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
    let pass = "Sanad@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

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
      password: assignPasswordInput.trim() || undefined,
      nationalId: assignNationalIdInput.trim() || undefined,
      phone: assignPhoneInput.trim() || undefined,
    });
    setAssignEmailInput("");
    setAssignNameInput("");
    setAssignPasswordInput("");
    setAssignNationalIdInput("");
    setAssignPhoneInput("");
    setShowAddUserModal(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !resetPasswordModalUser ||
      !resetNewPassword.trim() ||
      resetNewPassword.trim().length < 6
    )
      return;

    onAssignEmailRole?.({
      email: resetPasswordModalUser.email,
      fullNameAr: resetPasswordModalUser.fullNameAr,
      role: resetPasswordModalUser.role,
      tenantId: resetPasswordModalUser.tenantId,
      tenantNameAr: resetPasswordModalUser.tenantNameAr,
      password: resetNewPassword.trim(),
    });

    setResetPasswordModalUser(null);
    setResetNewPassword("");
  };

  const handleModalResetPasswordSubmit = (user: ManagedUserItem) => {
    if (!modalNewPasswordInput.trim() || modalNewPasswordInput.trim().length < 6)
      return;

    onAssignEmailRole?.({
      email: user.email,
      fullNameAr: user.fullNameAr,
      role: user.role,
      tenantId: user.tenantId,
      tenantNameAr: user.tenantNameAr,
      password: modalNewPasswordInput.trim(),
    });

    setModalNewPasswordInput("");
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
              onClick={() => scrollToSection("section-beneficiary-intelligence")}
              className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>استعلام بالرقم القومي / الهاتف</span>
            </button>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 text-center">
          <button
            type="button"
            onClick={() => {
              setTenantFilter("ALL");
              scrollToSection("section-tenants-table");
            }}
            className="bg-slate-50 hover:bg-slate-100 p-2.5 sm:p-3.5 rounded-xl border border-slate-200 cursor-pointer transition text-center"
          >
            <div className="text-[11px] sm:text-xs text-slate-600 truncate">إجمالي الجهات والمبادرات</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {tenants.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setTenantFilter("PENDING_APPROVAL");
              scrollToSection("section-tenants-table");
            }}
            className="bg-amber-50 hover:bg-amber-100 p-2.5 sm:p-3.5 rounded-xl border border-amber-200 cursor-pointer transition text-center"
          >
            <div className="text-[11px] sm:text-xs text-amber-900 truncate">جهات بانتظار الاعتماد</div>
            <div className="text-base sm:text-lg font-bold text-amber-900 mt-1">
              {pendingTenantsCount}
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-tenants-table")}
            className="bg-purple-50 hover:bg-purple-100 p-2.5 sm:p-3.5 rounded-xl border border-purple-200 cursor-pointer transition text-center"
          >
            <div className="text-[11px] sm:text-xs text-purple-900 truncate">إجمالي الحالات المسجلة</div>
            <div className="text-base sm:text-lg font-bold text-purple-900 mt-1">
              {cases.length}
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-tenants-table")}
            className="bg-emerald-50 hover:bg-emerald-100 p-2.5 sm:p-3.5 rounded-xl border border-emerald-200 cursor-pointer transition text-center"
          >
            <div className="text-[11px] sm:text-xs text-emerald-900 truncate">إجمالي التبرعات المؤكدة</div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 mt-1 truncate">
              {totalConfirmedDonations.toLocaleString("ar-EG")} ج.م
            </div>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("section-audit-logs")}
            className="bg-blue-50 hover:bg-blue-100 p-2.5 sm:p-3.5 rounded-xl border border-blue-200 cursor-pointer transition text-center col-span-2 sm:col-span-1 lg:col-span-1"
          >
            <div className="text-[11px] sm:text-xs text-blue-900 truncate">سجلات التدقيق الأمني</div>
            <div className="text-base sm:text-lg font-bold text-blue-900 mt-1">
              {auditLogs.length}
            </div>
          </button>
        </div>
      </section>

      {/* Central Beneficiary Intelligence & Search (360° Profile) */}
      <section id="section-beneficiary-intelligence" className="space-y-2">
        <BeneficiarySearchBar
          beneficiaryProfiles={activeBeneficiaryList}
          onSelectBeneficiary={handleOpenBeneficiaryProfile}
        />
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md">
              حوكمة المستخدمين والوصول (User Governance & Security)
            </span>
            <h3 className="font-bold text-lg text-slate-900 mt-1">
              إدارة المستخدمين، الصلاحيات، وكلمات المرور المعتمدة
            </h3>
            <p className="text-xs text-slate-600">
              يمكنك إضافة أي مستخدم جديد مع كلمة مرور مخصصة وتحديد دوره الوظيفي، أو تعديل الأدوار وإعادة تعيين كلمات المرور فوراً.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>إضافة مستخدم جديد واعتماد كلمة المرور</span>
          </button>
        </div>

        {/* Form to add or pre-assign or update role & credentials */}
        <form
          onSubmit={handleAssignEmailSubmit}
          className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>👤</span>
              <span>نموذج إضافة مستخدم جديد أو تحديث صلاحيات وكلمة مرور حساب مسجل:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const generated = generateRandomStrongPassword();
                setAssignPasswordInput(generated);
                setShowAssignPassword(true);
              }}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              توليد كلمة مرور عشوائية
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label
                htmlFor="assign-name-input"
                className="block text-xs font-bold text-slate-700"
              >
                الاسم الكامل رباعياً (كما في البطاقة) *
              </label>
              <input
                id="assign-name-input"
                type="text"
                required
                placeholder="أحمد محمد علي إبراهيم"
                value={assignNameInput}
                onChange={(e) => setAssignNameInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label
                htmlFor="assign-password-input"
                className="block text-xs font-bold text-slate-700"
              >
                كلمة المرور للحساب *
              </label>
              <div className="relative flex items-center">
                <input
                  id="assign-password-input"
                  type={showAssignPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="Sanad@2026"
                  value={assignPasswordInput}
                  onChange={(e) => setAssignPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-3 pr-14 py-2 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAssignPassword((prev) => !prev)}
                  className="absolute left-2 text-[10px] text-purple-700 font-bold px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100"
                >
                  {showAssignPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
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
                  مدير جمعية خيرية مشهرة (ASSOCIATION_ADMIN)
                </option>
                <option value="INDIVIDUAL_INITIATIVE">
                  مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)
                </option>
                <option value="RESEARCH_SUPERVISOR">
                  مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
                </option>
                <option value="VOLUNTEER">باحث / متطوع ميداني (VOLUNTEER)</option>
                <option value="BENEFICIARY">مستفيد / طالب مساعدة (BENEFICIARY)</option>
                <option value="SUPER_ADMIN">
                  مدير المنصة المركزي (SUPER_ADMIN)
                </option>
              </select>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label
                htmlFor="assign-nid-input"
                className="block text-xs font-bold text-slate-700"
              >
                الرقم القومي المصري (14 رقماً - اختياري)
              </label>
              <input
                id="assign-nid-input"
                type="text"
                dir="ltr"
                maxLength={14}
                placeholder="29001010101234"
                value={assignNationalIdInput}
                onChange={(e) => setAssignNationalIdInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white"
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label
                htmlFor="assign-phone-input"
                className="block text-xs font-bold text-slate-700"
              >
                رقم الهاتف المحمول (01xxxxxxxxx - اختياري)
              </label>
              <input
                id="assign-phone-input"
                type="tel"
                dir="ltr"
                placeholder="01012345678"
                value={assignPhoneInput}
                onChange={(e) => setAssignPhoneInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white"
              />
            </div>

            <div className="md:col-span-4 flex flex-col gap-2">
              {(assignRoleSelect === "ASSOCIATION_ADMIN" ||
                assignRoleSelect === "INDIVIDUAL_INITIATIVE" ||
                assignRoleSelect === "RESEARCH_SUPERVISOR" ||
                assignRoleSelect === "VOLUNTEER") && (
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
                className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>اعتماد المستخدم وتفعيل الحساب فوراً</span>
              </button>
            </div>
          </div>
        </form>

        {/* Registered Users & Email Roles Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3">المستخدم والبريد</th>
                <th className="p-3">الدور الوظيفي والصلاحيات</th>
                <th className="p-3">النطاق / الجهة</th>
                <th className="p-3">الرقم القومي / الهاتف</th>
                <th className="p-3 text-center">إدارة الصلاحيات وكلمة المرور</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((u) => {
                const selectedRoleForRow = rowSelectedRole[u.email] || u.role;
                return (
                  <tr
                    key={u.email}
                    onClick={() => {
                      if (u.role === "BENEFICIARY") {
                        handleOpenBeneficiaryProfile({
                          email: u.email,
                          name: u.fullNameAr,
                          phone: u.phoneE164,
                          nationalId: u.maskedNationalId,
                        });
                      } else {
                        setSelectedUserDetails(u);
                      }
                    }}
                    className="border-b border-slate-100 hover:bg-purple-50/40 cursor-pointer transition"
                  >
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{u.fullNameAr}</span>
                        {u.role === "BENEFICIARY" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
                            مستفيد 360°
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-purple-800 font-semibold mt-0.5">
                        {u.email}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                        <span>🛡️</span>
                        <span>{ROLE_LABELS_AR[u.role] || u.role}</span>
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-semibold">
                        {u.permissionsCount} صلاحية معتمدة بالنظام
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{u.tenantNameAr}</td>
                    <td className="p-3 font-mono text-slate-600">
                      <div>{u.maskedNationalId}</div>
                      <div dir="ltr" className="text-right text-[11px] text-slate-500">
                        {u.phoneE164}
                      </div>
                    </td>
                    <td
                      className="p-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {u.role === "BENEFICIARY" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenBeneficiaryProfile({
                                email: u.email,
                                name: u.fullNameAr,
                                phone: u.phoneE164,
                                nationalId: u.maskedNationalId,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] cursor-pointer transition flex items-center gap-1 shadow-sm"
                          >
                            <span>👤</span>
                            <span>ملف 360°</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetails(u)}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] cursor-pointer transition flex items-center gap-1"
                        >
                          <span>🔍</span>
                          <span>عرض الصلاحيات</span>
                        </button>
                        <select
                          aria-label={`تغيير دور ${u.email}`}
                          value={selectedRoleForRow}
                          onChange={(e) =>
                            setRowSelectedRole((prev) => ({
                              ...prev,
                              [u.email]: e.target.value as TargetAuthRole,
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white font-semibold cursor-pointer"
                        >
                          <option value="SUPER_ADMIN">مدير المنصة</option>
                          <option value="ASSOCIATION_ADMIN">مدير جمعية</option>
                          <option value="INDIVIDUAL_INITIATIVE">مبادر فردي</option>
                          <option value="RESEARCH_SUPERVISOR">مشرف بحث</option>
                          <option value="VOLUNTEER">باحث ميداني</option>
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition text-[11px]"
                        >
                          تحديث الدور
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordModalUser(u);
                            setResetNewPassword("");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] cursor-pointer transition flex items-center gap-1"
                        >
                          <span>🔑</span>
                          <span>تعيين كلمة المرور</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Roles & Permissions Matrix Guide Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                معايير الحوكمة وفصل المهام الرقابية (Segregation of Duties - SoD)
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">
                دليل مصفوفة الصلاحيات والأدوار المعتمدة في منصة سَنَد
              </h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {ROLE_GUIDE_ITEMS_AR.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setActiveRoleGuideTab(item.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeRoleGuideTab === item.code
                      ? "bg-purple-700 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.titleAr.split("(")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active Role Guide Tab Details */}
          {(() => {
            const activeGuide =
              ROLE_GUIDE_ITEMS_AR.find((r) => r.code === activeRoleGuideTab) ||
              ROLE_GUIDE_ITEMS_AR[0];
            const activePerms = ROLE_PERMISSIONS_MAP[activeGuide.code] || [];
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {activeGuide.titleAr}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      {activeGuide.permissionsCount} صلاحية
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeGuide.summaryAr}
                  </p>
                  <div className="space-y-1 border-t border-slate-100 pt-2">
                    <span className="text-[11px] font-bold text-slate-800 block">
                      المسؤوليات الرئيسية:
                    </span>
                    <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                      {activeGuide.responsibilitiesAr.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      قائمة الصلاحيات الممنوحة لهذا الدور بالتفصيل:
                    </span>
                    <span className="text-[11px] font-mono text-purple-700">
                      {activeGuide.code}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {activePerms.map((perm) => (
                      <div
                        key={perm}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start gap-2"
                      >
                        <span className="text-emerald-700 font-bold">✓</span>
                        <div className="flex-1">
                          <span className="font-mono text-[11px] font-bold text-slate-800 block">
                            {perm}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {PERMISSION_DESCRIPTIONS_AR[perm] || "صلاحية نظام معتمدة"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
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

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-right text-xs border-collapse min-w-[640px]">
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTenantDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-4 sm:my-8"
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedUserDetails(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
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

            {/* List of Permissions Granted to this user */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>
                    الصلاحيات المعتمدة لهذا الدور (
                    {(ROLE_PERMISSIONS_MAP[selectedUserDetails.role] || []).length}{" "}
                    صلاحية مفعّلة):
                  </span>
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-mono">
                  {selectedUserDetails.role}
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {(ROLE_PERMISSIONS_MAP[selectedUserDetails.role] || []).map(
                  (perm) => (
                    <div
                      key={perm}
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs flex items-start gap-2"
                    >
                      <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                      <div>
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {perm}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {PERMISSION_DESCRIPTIONS_AR[perm] ||
                            "صلاحية نظام معتمدة"}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quick Password Reset Inside User Card */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>إعادة تعيين كلمة المرور لهذا المستخدم:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateRandomStrongPassword();
                    setModalNewPasswordInput(generated);
                    setShowModalNewPassword(true);
                  }}
                  className="text-[10px] font-bold text-purple-700 underline cursor-pointer"
                >
                  توليد كلمة مرور
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type={showModalNewPassword ? "text" : "password"}
                  dir="ltr"
                  placeholder="كلمة مرور جديدة (6 خانات على الأقل)"
                  value={modalNewPasswordInput}
                  onChange={(e) => setModalNewPasswordInput(e.target.value)}
                  className="flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowModalNewPassword((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
                >
                  {showModalNewPassword ? "إخفاء" : "إظهار"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleModalResetPasswordSubmit(selectedUserDetails)
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </div>

            {selectedUserDetails.role === "BENEFICIARY" && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-2 text-right">
                <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span>🧕</span>
                  <span>هذا المستخدم مسجل كمستفيد بالخدمة ولديه ملف بحث اجتماعي شامل</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  يمكنك الاطلاع على كافة تفاصيل السكن، أفراد الأسرة، الدخل والديون، أرقام هواتف فريق البحث، وسجل المساعدات السابقة الموحد.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const u = selectedUserDetails;
                    setSelectedUserDetails(null);
                    handleOpenBeneficiaryProfile({
                      email: u.email,
                      name: u.fullNameAr,
                      phone: u.phoneE164,
                      nationalId: u.maskedNationalId.replace(/\*/g, ""),
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <span>👤</span>
                  <span>عرض بروفايل المستفيد الشامل (Beneficiary 360° Profile) ←</span>
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-sm text-center transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Reset Password Modal */}
      {resetPasswordModalUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setResetPasswordModalUser(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  إعادة تعيين كلمة المرور
                </h3>
                <p className="text-xs font-mono text-purple-800">
                  {resetPasswordModalUser.email} ({resetPasswordModalUser.fullNameAr})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordModalUser(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-bold text-slate-700"
                  >
                    كلمة المرور الجديدة (6 خانات على الأقل) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateRandomStrongPassword();
                      setResetNewPassword(gen);
                      setShowResetPassword(true);
                    }}
                    className="text-[10px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    توليد كلمة مرور
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="reset-new-password"
                    type={showResetPassword ? "text" : "password"}
                    dir="ltr"
                    required
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-3 pr-14 py-2 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="absolute left-2 text-[10px] text-purple-700 font-bold px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100"
                  >
                    {showResetPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResetPasswordModalUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm"
                >
                  حفظ وتحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Add User Modal */}
      {showAddUserModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  إضافة مستخدم جديد واعتماد الصلاحيات وكلمة المرور
                </h3>
                <p className="text-xs text-slate-500">
                  يتم حفظ بيانات المستخدم في قاعدة البيانات فوراً مع إمكانية تسجيل الدخول المباشر.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignEmailSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  الاسم الكامل رباعياً *
                </label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد علي خليل"
                  value={assignNameInput}
                  onChange={(e) => setAssignNameInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  البريد الإلكتروني الرسمي *
                </label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  placeholder="user@domain.com"
                  value={assignEmailInput}
                  onChange={(e) => setAssignEmailInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    كلمة المرور *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateRandomStrongPassword();
                      setAssignPasswordInput(gen);
                      setShowAssignPassword(true);
                    }}
                    className="text-[10px] font-bold text-purple-700 underline cursor-pointer"
                  >
                    توليد كلمة مرور
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showAssignPassword ? "text" : "password"}
                    dir="ltr"
                    required
                    placeholder="Sanad@2026"
                    value={assignPasswordInput}
                    onChange={(e) => setAssignPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-3 pr-14 py-2 text-xs font-mono bg-white focus:border-purple-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAssignPassword((prev) => !prev)}
                    className="absolute left-2 text-[10px] text-purple-700 font-bold px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100"
                  >
                    {showAssignPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  الدور الوظيفي والصلاحيات *
                </label>
                <select
                  value={assignRoleSelect}
                  onChange={(e) =>
                    setAssignRoleSelect(e.target.value as TargetAuthRole)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white cursor-pointer"
                >
                  <option value="ASSOCIATION_ADMIN">
                    مدير جمعية خيرية مشهرة (ASSOCIATION_ADMIN)
                  </option>
                  <option value="INDIVIDUAL_INITIATIVE">
                    مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)
                  </option>
                  <option value="RESEARCH_SUPERVISOR">
                    مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)
                  </option>
                  <option value="VOLUNTEER">باحث / متطوع ميداني (VOLUNTEER)</option>
                  <option value="BENEFICIARY">مستفيد / طالب مساعدة (BENEFICIARY)</option>
                  <option value="SUPER_ADMIN">
                    مدير المنصة المركزي (SUPER_ADMIN)
                  </option>
                </select>
              </div>

              {(assignRoleSelect === "ASSOCIATION_ADMIN" ||
                assignRoleSelect === "INDIVIDUAL_INITIATIVE" ||
                assignRoleSelect === "RESEARCH_SUPERVISOR" ||
                assignRoleSelect === "VOLUNTEER") && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    الجهة / المبادرة التابع لها
                  </label>
                  <select
                    value={assignTenantIdSelect}
                    onChange={(e) => setAssignTenantIdSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white cursor-pointer"
                  >
                    <option value="">اختر الجمعية / المبادرة</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    الرقم القومي (14 رقماً)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={14}
                    placeholder="29001010101234"
                    value={assignNationalIdInput}
                    onChange={(e) => setAssignNationalIdInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    رقم الهاتف المحمول
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="01012345678"
                    value={assignPhoneInput}
                    onChange={(e) => setAssignPhoneInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm"
                >
                  إضافة المستخدم واعتماد الصلاحيات
                </button>
              </div>
            </form>
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

      {/* Beneficiary 360 Full Details Modal */}
      <Beneficiary360Modal
        profile={internalBeneficiaryModal}
        isOpen={Boolean(internalBeneficiaryModal)}
        onClose={() => setInternalBeneficiaryModal(null)}
        onUpdateProfile={(updated) => {
          setInternalBeneficiaryModal(updated);
          onUpdateBeneficiaryProfile?.(updated);
        }}
      />
    </div>
  );
}
