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
  PERMISSION_MODULES_AR,
  resolveRoleLabelAr,
  resolveRolePermissions,
  type RoleGuideItem,
  type PermissionModuleGroup,
} from "../lib/domain/sanad-rules";

export interface DynamicRoleItem {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr?: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedUserItem {
  id?: string;
  email: string;
  fullNameAr: string;
  maskedNationalId: string;
  phoneE164: string;
  role: string;
  roleNameAr?: string;
  tenantId: string | null;
  tenantNameAr: string;
  permissionsCount: number;
  customPermissions?: string[];
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
  roles?: DynamicRoleItem[];
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
    role: string;
    customPermissions?: string[];
    tenantId?: string | null;
    tenantNameAr?: string | null;
    password?: string;
    nationalId?: string;
    phone?: string;
  }) => void;
  onCreateCustomRole?: (payload: {
    code: string;
    nameAr: string;
    descriptionAr?: string;
    permissions: string[];
  }) => Promise<void> | void;
  onUpdateRolePermissions?: (payload: {
    code: string;
    nameAr?: string;
    descriptionAr?: string;
    permissions: string[];
  }) => Promise<void> | void;
  onCreateBeneficiaryUser?: (payload: {
    nationalId: string;
    fullNameAr: string;
    mobile: string;
    email?: string;
    password?: string;
    governorate?: string;
    address?: string;
    familyMembersCount?: number;
    monthlyIncomeEgp?: number;
    housingType?: string;
    maritalStatus?: string;
  }) => Promise<void> | void;
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
  roles = [],
  onUpdateTenantStatus,
  onCreateTenant,
  onDecideSharingRequest,
  onAssignEmailRole,
  onCreateCustomRole,
  onUpdateRolePermissions,
  onCreateBeneficiaryUser,
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

  const DEFAULT_DYNAMIC_ROLES: DynamicRoleItem[] = [
    {
      id: "role-super-admin",
      code: "SUPER_ADMIN",
      nameAr: "مدير المنصة المركزي (SUPER_ADMIN)",
      descriptionAr: "أعلى سلطة حوكمة ورقابة على المنصة والجمعيات والمستخدمين.",
      permissions: ROLE_PERMISSIONS_MAP.SUPER_ADMIN,
      isSystem: true,
    },
    {
      id: "role-association-admin",
      code: "ASSOCIATION_ADMIN",
      nameAr: "مدير جمعية خيرية مشهرة (ASSOCIATION_ADMIN)",
      descriptionAr: "إدارة الجمعية وفريق العمل والحالات المستقلة والتبرعات والتسليم.",
      permissions: ROLE_PERMISSIONS_MAP.ASSOCIATION_ADMIN,
      isSystem: true,
    },
    {
      id: "role-individual-initiative",
      code: "INDIVIDUAL_INITIATIVE",
      nameAr: "مبادر فردي مستقل (INDIVIDUAL_INITIATIVE)",
      descriptionAr: "إدارة حالات ومبادرات العمل الأهلي المستقل بموجب توثيق الهوية.",
      permissions: ROLE_PERMISSIONS_MAP.INDIVIDUAL_INITIATIVE,
      isSystem: true,
    },
    {
      id: "role-research-supervisor",
      code: "RESEARCH_SUPERVISOR",
      nameAr: "مشرف البحث الاجتماعي (RESEARCH_SUPERVISOR)",
      descriptionAr: "إسناد الزيارات الميدانية ومراجعة تقارير الاستحقاق والاعتماد الرقابي المفصول.",
      permissions: ROLE_PERMISSIONS_MAP.RESEARCH_SUPERVISOR,
      isSystem: true,
    },
    {
      id: "role-volunteer",
      code: "VOLUNTEER",
      nameAr: "باحث / متطوع ميداني (VOLUNTEER)",
      descriptionAr: "إجراء المسوح الميدانية ورفع تقارير البيئة المعيشية وتوثيق التسليم بالرقم القومي.",
      permissions: ROLE_PERMISSIONS_MAP.VOLUNTEER,
      isSystem: true,
    },
    {
      id: "role-beneficiary",
      code: "BENEFICIARY",
      nameAr: "مستفيد / طالب مساعدة (BENEFICIARY)",
      descriptionAr: "تقديم طلبات المساعدة الذاتية ومتابعة الصرف ورفع الوثائق والتظلمات.",
      permissions: ROLE_PERMISSIONS_MAP.BENEFICIARY,
      isSystem: true,
    },
  ];

  const activeDynamicRoles = roles && roles.length > 0 ? roles : DEFAULT_DYNAMIC_ROLES;

  // Role Builder & Custom Permissions Management State
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleNameAr, setNewRoleNameAr] = useState("");
  const [newRoleDescAr, setNewRoleDescAr] = useState("");
  const [newRoleSelectedPerms, setNewRoleSelectedPerms] = useState<string[]>([]);
  const [newRoleCustomManualPerms, setNewRoleCustomManualPerms] = useState("");

  const [editingRole, setEditingRole] = useState<DynamicRoleItem | null>(null);
  const [editRoleNameAr, setEditRoleNameAr] = useState("");
  const [editRoleDescAr, setEditRoleDescAr] = useState("");
  const [editRoleSelectedPerms, setEditRoleSelectedPerms] = useState<string[]>([]);
  const [editRoleCustomManualPerms, setEditRoleCustomManualPerms] = useState("");

  // Instant Beneficiary Registration State
  const [showCreateBeneficiaryModal, setShowCreateBeneficiaryModal] = useState(false);
  const [benNid, setBenNid] = useState("");
  const [benFullName, setBenFullName] = useState("");
  const [benMobile, setBenMobile] = useState("");
  const [benEmail, setBenEmail] = useState("");
  const [benPassword, setBenPassword] = useState("");
  const [showBenPassword, setShowBenPassword] = useState(false);
  const [benGov, setBenGov] = useState("القاهرة");
  const [benAddress, setBenAddress] = useState("");
  const [benMarital, setBenMarital] = useState("معيل لأسرة");
  const [benFamilyCount, setBenFamilyCount] = useState(4);
  const [benIncome, setBenIncome] = useState(2500);
  const [benHousing, setBenHousing] = useState("إيجار عادي");

  // User-level custom permissions overrides in Add User form
  const [assignCustomPerms, setAssignCustomPerms] = useState<string[]>([]);
  const [assignManualPermsText, setAssignManualPermsText] = useState("");
  const [showAssignCustomPerms, setShowAssignCustomPerms] = useState(false);

  // User Modal custom permissions editor state
  const [modalUserRole, setModalUserRole] = useState<string>("");
  const [modalUserCustomPerms, setModalUserCustomPerms] = useState<string[]>([]);
  const [modalUserManualPermsText, setModalUserManualPermsText] = useState("");
  const [showModalUserPermsEditor, setShowModalUserPermsEditor] = useState(false);

  // Assign Role & User Provisioning states
  const [assignEmailInput, setAssignEmailInput] = useState("");
  const [assignNameInput, setAssignNameInput] = useState("");
  const [assignPasswordInput, setAssignPasswordInput] = useState("");
  const [showAssignPassword, setShowAssignPassword] = useState(false);
  const [assignNationalIdInput, setAssignNationalIdInput] = useState("");
  const [assignPhoneInput, setAssignPhoneInput] = useState("");
  const [assignRoleSelect, setAssignRoleSelect] = useState<string>("ASSOCIATION_ADMIN");
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
  const [activeRoleGuideTab, setActiveRoleGuideTab] = useState<string>("SUPER_ADMIN");

  const [rowSelectedRole, setRowSelectedRole] = useState<Record<string, string>>({});

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

    const manualList = assignManualPermsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const combinedCustom = Array.from(
      new Set([...assignCustomPerms, ...manualList])
    );

    onAssignEmailRole?.({
      email: cleanEmail,
      fullNameAr: assignNameInput.trim() || undefined,
      role: assignRoleSelect,
      customPermissions: combinedCustom,
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
    setAssignCustomPerms([]);
    setAssignManualPermsText("");
    setShowAddUserModal(false);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newRoleCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_");
    if (!cleanCode) return;
    const manualList = newRoleCustomManualPerms
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const combined = Array.from(
      new Set([...newRoleSelectedPerms, ...manualList])
    );

    await onCreateCustomRole?.({
      code: cleanCode,
      nameAr: newRoleNameAr.trim() || cleanCode,
      descriptionAr: newRoleDescAr.trim() || undefined,
      permissions: combined,
    });

    setShowCreateRoleModal(false);
    setNewRoleCode("");
    setNewRoleNameAr("");
    setNewRoleDescAr("");
    setNewRoleSelectedPerms([]);
    setNewRoleCustomManualPerms("");
  };

  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    const manualList = editRoleCustomManualPerms
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const combined = Array.from(
      new Set([...editRoleSelectedPerms, ...manualList])
    );

    await onUpdateRolePermissions?.({
      code: editingRole.code,
      nameAr: editRoleNameAr.trim() || editingRole.nameAr,
      descriptionAr: editRoleDescAr.trim() || undefined,
      permissions: combined,
    });

    setEditingRole(null);
  };

  const handleCreateBeneficiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benNid.trim() || !benFullName.trim() || !benMobile.trim()) return;

    await onCreateBeneficiaryUser?.({
      nationalId: benNid.trim(),
      fullNameAr: benFullName.trim(),
      mobile: benMobile.trim(),
      email: benEmail.trim() || undefined,
      password: benPassword.trim() || undefined,
      governorate: benGov,
      address: benAddress.trim(),
      maritalStatus: benMarital,
      familyMembersCount: benFamilyCount,
      monthlyIncomeEgp: benIncome,
      housingType: benHousing,
    });

    setShowCreateBeneficiaryModal(false);
    setBenNid("");
    setBenFullName("");
    setBenMobile("");
    setBenEmail("");
    setBenPassword("");
    setBenAddress("");
  };

  const handleOpenEditRole = (role: DynamicRoleItem) => {
    setEditingRole(role);
    setEditRoleNameAr(role.nameAr);
    setEditRoleDescAr(role.descriptionAr || "");
    setEditRoleSelectedPerms(role.permissions || []);
    setEditRoleCustomManualPerms("");
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
      {/* Platform Overview Banner & Clickable KPIs (NAGM Design) */}
      <section className="ng-panel p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="ng-badge ng-badge-brand font-bold text-xs">
              لوحة الحوكمة المركزية (SUPER_ADMIN) • الحساب السيادي المعتمد: eng.mhashim@gmail.com
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-ink mt-1.5 leading-snug">
              إدارة المنصة، هندسة وتخصيص الأدوار، واعتماد الكيانات والمستفيدين
            </h2>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              تحكم كامل في تخصيص الأدوار والصلاحيات (يدوياً أو بالاختيار)، إنشاء المستفيدين، وتتبع الحوكمة وفصل المهام الرقابية.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("section-beneficiary-intelligence")}
              className="ng-btn-ghost text-xs !h-10 !px-3.5 cursor-pointer flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>استعلام بالرقم القومي</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateBeneficiaryModal(true)}
              className="ng-btn-primary text-xs !h-10 !px-4 cursor-pointer flex items-center gap-1.5"
            >
              <span>🧕</span>
              <span>+ تسجيل مستفيد جديد فوري</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(true)}
              className="ng-btn-primary text-xs !h-10 !px-4 cursor-pointer flex items-center gap-1.5"
            >
              <span>🛡️</span>
              <span>+ إنشاء دور وظيفي مخصص</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("section-roles-hub")}
              className="ng-btn-ghost text-xs !h-10 !px-3.5 cursor-pointer flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>هندسة الصلاحيات ({activeDynamicRoles.length} أدوار)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddTenantModal(true)}
              className="ng-btn-ghost text-xs !h-10 !px-3.5 cursor-pointer flex items-center gap-1.5"
            >
              <span>🏢</span>
              <span>+ إضافة جهة خيرية</span>
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
          {filteredTenants.length === 0 ? (
            <div className="md:col-span-2 p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
              <div className="text-3xl">🏢</div>
              <h4 className="font-bold text-sm text-slate-800">
                لا توجد جهات خيرية مسجلة حالياً بهذا التصنيف
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                النظام في حالة حوكمة نظيفة. يمكنك تسجيل جهة خيرية مشهرة أو مبادرة فردية مستقلة معتمدة فوراً بالنقر أدناه:
              </p>
              <button
                type="button"
                onClick={() => setShowAddTenantModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-sm transition inline-flex items-center gap-1.5"
              >
                <span>🏢</span>
                <span>+ إضافة جهة خيرية أو مبادرة جديدة</span>
              </button>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
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
            ))
          )}
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
                onChange={(e) => setAssignRoleSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white cursor-pointer"
              >
                {activeDynamicRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.nameAr} ({r.code})
                  </option>
                ))}
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
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAssignCustomPerms((prev) => !prev)}
                  className="text-[11px] font-bold text-brand hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{showAssignCustomPerms ? "▲" : "▼"}</span>
                  <span>
                    تخصيص صلاحيات إضافية للمستخدم ({assignCustomPerms.length})
                  </span>
                </button>
              </div>

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
                className="w-full py-2.5 px-4 rounded-xl ng-btn-primary text-xs font-bold shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <span>✓</span>
                <span>اعتماد المستخدم وتفعيل حسابه بالدور المحدد</span>
              </button>
            </div>

            {/* Custom Permissions Override Accordion inside Add User form */}
            {showAssignCustomPerms && (
              <div className="md:col-span-12 bg-white rounded-xl border border-brandBorder p-3.5 space-y-3 mt-2">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div>
                    <span className="text-xs font-bold text-ink">
                      تخصيص صلاحيات استثنائية لهذا المستخدم (User-Level Permissions Override):
                    </span>
                    <p className="text-[11px] text-ink-muted">
                      تضاف هذه الصلاحيات فوراً لحساب المستخدم بالإضافة إلى الصلاحيات الأساسية للدور ({assignRoleSelect}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignCustomPerms([])}
                    className="text-[10px] text-rose-600 underline font-bold"
                  >
                    تفريغ الصلاحيات الإضافية
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {PERMISSION_MODULES_AR.flatMap((m) => m.permissions).map((perm) => {
                    const isChecked = assignCustomPerms.includes(perm.code);
                    return (
                      <label
                        key={perm.code}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-brand-soft border-brandBorder text-brandInk font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignCustomPerms((prev) => [...prev, perm.code]);
                            } else {
                              setAssignCustomPerms((prev) =>
                                prev.filter((c) => c !== perm.code)
                              );
                            }
                          }}
                          className="mt-0.5 rounded text-brand focus:ring-brand"
                        />
                        <div className="flex-1">
                          <span className="block text-[11px] font-bold">
                            {perm.labelAr}
                          </span>
                          <span className="block text-[10px] font-mono text-slate-500">
                            {perm.code}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-1 border-t border-line pt-2">
                  <label className="block text-xs font-bold text-ink">
                    إدخال صلاحيات يدوية حرة (Manual Free-form Permissions):
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    placeholder="custom:audit:export, tenant:custom:action"
                    value={assignManualPermsText}
                    onChange={(e) => setAssignManualPermsText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono bg-slate-50"
                  />
                </div>
              </div>
            )}
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
                      setSelectedUserDetails(u);
                      setModalUserRole(u.role);
                      setModalUserCustomPerms(u.customPermissions || []);
                      setShowModalUserPermsEditor(false);
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
                        <span>{resolveRoleLabelAr(u.role, activeDynamicRoles)}</span>
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
                              [u.email]: e.target.value,
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white font-semibold cursor-pointer max-w-[140px]"
                        >
                          {activeDynamicRoles.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.nameAr.split("(")[0].trim()}
                            </option>
                          ))}
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

        {/* Dynamic Roles & Permissions Matrix Hub */}
        <div className="bg-white border border-line rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-brand bg-brandSoft px-2.5 py-0.5 rounded-full border border-brandBorder">
                  محرك إدارة الصلاحيات والأدوار المتقدم (Dynamic RBAC Engine)
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activeDynamicRoles.length} أدوار معتمدة
                </span>
              </div>
              <h4 className="font-extrabold text-base text-ink mt-1.5">
                هندسة وتخصيص الأدوار والصلاحيات بالمنصة
              </h4>
              <p className="text-xs text-ink3 mt-0.5">
                يمكن لصاحب المنصة المركزية إضافة أدوار جديدة، وتسميتها وتحديد صلاحياتها بالكامل إما عبر الاختيار من القوائم المصنفة أو كتابة الصلاحيات يدوياً.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewRoleCode("");
                  setNewRoleNameAr("");
                  setNewRoleDescAr("");
                  setNewRoleSelectedPerms([]);
                  setNewRoleCustomManualPerms("");
                  setShowCreateRoleModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand to-brandInk hover:opacity-95 text-white font-bold text-xs shadow-sm cursor-pointer transition flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>إنشاء دور وظيفي مخصص</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBenNid("");
                  setBenFullName("");
                  setBenMobile("");
                  setBenEmail("");
                  setBenPassword("");
                  setShowCreateBeneficiaryModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <span>🧕</span>
                <span>+ تسجيل مستفيد جديد فوري بالمنظومة</span>
              </button>
            </div>
          </div>

          {/* Grid of Dynamic Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeDynamicRoles.map((role) => {
              const isSelected = activeRoleGuideTab === role.code;
              return (
                <div
                  key={role.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveRoleGuideTab(role.code);
                    const el = document.getElementById("role-permissions-inspector");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveRoleGuideTab(role.code);
                      const el = document.getElementById("role-permissions-inspector");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }
                    }
                  }}
                  className={`group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between space-y-3.5 transform ${
                    isSelected
                      ? "border-brand bg-gradient-to-br from-purple-50/90 via-white to-purple-50/40 shadow-md ring-2 ring-brand/50 -translate-y-1"
                      : "border-line bg-white hover:border-brand/60 hover:bg-slate-50/70 hover:shadow-lg hover:-translate-y-1 shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-extrabold text-sm text-ink group-hover:text-brand transition leading-tight">
                          {role.nameAr}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] font-bold text-brand bg-brandSoft px-2 py-0.5 rounded inline-block">
                            {role.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              role.isSystem
                                ? "bg-slate-100 text-slate-700"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            }`}
                          >
                            {role.isSystem ? "دور نظام" : "دور مخصص"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 transition flex items-center gap-1 ${
                          isSelected
                            ? "bg-brand text-white shadow-xs"
                            : "bg-slate-100 text-slate-500 group-hover:bg-brandSoft group-hover:text-brandInk"
                        }`}
                      >
                        {isSelected ? "معروض الآن ✓" : "انقر للمعاينة 👈"}
                      </span>
                    </div>

                    <p className="text-xs text-ink3 line-clamp-2 leading-relaxed">
                      {role.descriptionAr || "دور وظيفي معتمد في قاعدة بيانات سَنَد."}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-line flex items-center gap-1">
                      <span className="text-brand">🛡️</span>
                      <span>{role.permissions.length} صلاحية معتمدة</span>
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditRole(role);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-ink text-[11px] font-bold cursor-pointer transition shadow-2xs"
                      >
                        تعديل الصلاحيات
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoleGuideTab(role.code);
                          const el = document.getElementById("role-permissions-inspector");
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs ${
                          isSelected
                            ? "bg-brand text-white shadow-xs"
                            : "bg-brandSoft text-brandInk hover:bg-brand hover:text-white"
                        }`}
                      >
                        <span>{isSelected ? "معروض ✓" : "عرض الصلاحيات"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Role Permissions Inspector Panel */}
          {(() => {
            const currentRole =
              activeDynamicRoles.find((r) => r.code === activeRoleGuideTab) ||
              activeDynamicRoles[0];
            if (!currentRole) return null;
            const perms = currentRole.permissions || [];

            return (
              <div
                id="role-permissions-inspector"
                className="bg-slate-50/70 border border-line rounded-2xl p-4 space-y-4 scroll-mt-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-sm text-ink">
                        تفاصيل مصفوفة الصلاحيات للدور: {currentRole.nameAr}
                      </h5>
                      <span className="font-mono text-xs font-bold text-brand bg-white px-2 py-0.5 rounded border border-line">
                        {currentRole.code}
                      </span>
                    </div>
                    <p className="text-xs text-ink3 mt-0.5">
                      {currentRole.descriptionAr || "صلاحيات هذا الدور مفعلة وتطبق فوراً على أي مستخدم يسند إليه هذا الدور."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                      {perms.length} صلاحية معتمدة
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(currentRole)}
                      className="px-3 py-1 rounded-xl bg-brand text-white font-bold text-xs hover:bg-brandInk transition cursor-pointer shadow-sm"
                    >
                      تعديل الصلاحيات
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PERMISSION_MODULES_AR.map((mod) => {
                    const modPermsInRole = mod.permissions.filter((p) =>
                      perms.includes(p.code)
                    );
                    if (modPermsInRole.length === 0) return null;

                    return (
                      <div
                        key={mod.id}
                        className="bg-white border border-line rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-line pb-1.5">
                          <span className="font-bold text-xs text-ink">
                            {mod.nameAr}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brandSoft text-brandInk">
                            {modPermsInRole.length}
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {modPermsInRole.map((p) => (
                            <div
                              key={p.code}
                              className="text-xs p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-1.5"
                            >
                              <span className="text-emerald-700 font-bold text-sm leading-none mt-0.5">
                                ✓
                              </span>
                              <div className="flex-1">
                                <span className="block font-bold text-[11px] text-ink">
                                  {p.labelAr}
                                </span>
                                <span className="block font-mono text-[9px] text-slate-500">
                                  {p.code}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Manual / Custom Uncategorized Permissions */}
                  {(() => {
                    const knownCodes = new Set(
                      PERMISSION_MODULES_AR.flatMap((m) =>
                        m.permissions.map((p) => p.code)
                      )
                    );
                    const customManual = perms.filter((c) => !knownCodes.has(c));
                    if (customManual.length === 0) return null;

                    return (
                      <div className="bg-white border border-line rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-line pb-1.5">
                          <span className="font-bold text-xs text-purple-900">
                            صلاحيات مخصصة وحرة (Manual Custom)
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">
                            {customManual.length}
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {customManual.map((code) => (
                            <div
                              key={code}
                              className="text-xs p-1.5 rounded-lg bg-purple-50/60 border border-purple-200 flex items-start gap-1.5"
                            >
                              <span className="text-purple-700 font-bold">★</span>
                              <div className="flex-1">
                                <span className="block font-mono text-[11px] font-bold text-purple-950">
                                  {code}
                                </span>
                                <span className="block text-[10px] text-purple-700">
                                  صلاحية يدوية مخصصة
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
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
                <strong className="text-emerald-800 font-bold">
                  {resolveRoleLabelAr(selectedUserDetails.role, activeDynamicRoles)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">النطاق / الجهة:</span>
                <strong className="text-slate-900 font-bold">
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

            {/* Dynamic Role Switcher for this User */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">
                  تعديل وتحديد الدور الوظيفي لهذا الحساب:
                </label>
                <span className="text-[10px] font-bold text-brand bg-brandSoft px-2 py-0.5 rounded">
                  التحكم بالصلاحيات
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={modalUserRole || selectedUserDetails.role}
                  onChange={(e) => setModalUserRole(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:border-brand cursor-pointer"
                >
                  {activeDynamicRoles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.nameAr}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    const nextRole = modalUserRole || selectedUserDetails.role;
                    onAssignEmailRole?.({
                      email: selectedUserDetails.email,
                      fullNameAr: selectedUserDetails.fullNameAr,
                      role: nextRole,
                      customPermissions: modalUserCustomPerms,
                      tenantId: selectedUserDetails.tenantId,
                      tenantNameAr: selectedUserDetails.tenantNameAr,
                      nationalId: selectedUserDetails.maskedNationalId,
                      phone: selectedUserDetails.phoneE164,
                    });
                    setSelectedUserDetails(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
                >
                  حفظ وتفعيل الدور للمستخدم
                </button>
              </div>

              {/* Toggle User Custom Permissions */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModalUserPermsEditor((prev) => !prev)}
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showModalUserPermsEditor ? "▲ إخفاء" : "▼ تخصيص صلاحيات إضافية لهذا المستخدم (User-Level Overrides)"}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({modalUserCustomPerms.length} صلاحية مخصصة)
                  </span>
                </button>

                {showModalUserPermsEditor && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-line space-y-3">
                    <p className="text-[11px] text-slate-600">
                      يمكنك منح هذا المستخدم صلاحيات إضافية مستقلة عن صلاحيات دوره الأساسي:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {PERMISSION_MODULES_AR.flatMap((m) => m.permissions).map((perm) => {
                        const isChecked = modalUserCustomPerms.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? "bg-brandSoft border-brandBorder text-brandInk font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setModalUserCustomPerms((prev) => [...prev, perm.code]);
                                } else {
                                  setModalUserCustomPerms((prev) =>
                                    prev.filter((c) => c !== perm.code)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded text-brand focus:ring-brand"
                            />
                            <div className="flex-1">
                              <span className="block text-[11px] font-bold">
                                {perm.labelAr}
                              </span>
                              <span className="block text-[9px] font-mono text-slate-500">
                                {perm.code}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List of Permissions Granted to this user */}
            {(() => {
              const currentEffectiveRole = modalUserRole || selectedUserDetails.role;
              const resolvedPerms = resolveRolePermissions(
                currentEffectiveRole,
                modalUserCustomPerms,
                activeDynamicRoles
              );

              return (
                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>
                        الصلاحيات المعتمدة لهذا الحساب (
                        {resolvedPerms.length} صلاحية مفعّلة):
                      </span>
                    </span>
                    <span className="text-[10px] font-bold text-brand bg-brandSoft px-2 py-0.5 rounded-full font-mono">
                      {currentEffectiveRole}
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    {resolvedPerms.map((perm) => (
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
                            {PERMISSION_DESCRIPTIONS_AR[perm] || "صلاحية نظام معتمدة"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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

      {/* ===================================================================== */}
      {/* MODAL 5: Create Dynamic Custom Role Modal                             */}
      {/* ===================================================================== */}
      {showCreateRoleModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateRoleSubmit}
            className="bg-white rounded-2xl border border-line max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[11px] font-bold text-brand bg-brandSoft px-2.5 py-0.5 rounded-full border border-brandBorder">
                  محرك إدارة الصلاحيات والأدوار المتقدم
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-ink mt-1">
                  إنشاء دور وظيفي مخصص وتحديد صلاحياته (Create Custom Role)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  كود الدور الوظيفي بالإنجليزية (Role Code - فريد) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="مثال: AUDITOR أو FINANCE_OFFICER"
                  value={newRoleCode}
                  onChange={(e) =>
                    setNewRoleCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^A-Z0-9_]/g, "")
                    )
                  }
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-mono font-bold bg-white text-ink focus:border-brand focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  حروف إنجليزية كبيرة وأرقام وشرطة سفلية فقط.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  اسم الدور باللغة العربية (Role Name Ar) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مراقب حسابات مالية وتبرعات"
                  value={newRoleNameAr}
                  onChange={(e) => setNewRoleNameAr(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-bold bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                وصف ومسؤوليات الدور (اختياري)
              </label>
              <input
                type="text"
                placeholder="وصف مختصر للمهام والواجبات الموكلة لشاغلي هذا الدور..."
                value={newRoleDescAr}
                onChange={(e) => setNewRoleDescAr(e.target.value)}
                className="w-full rounded-xl border border-line px-3.5 py-2 text-xs bg-white text-ink focus:border-brand focus:outline-none"
              />
            </div>

            {/* Permissions Selection Checklist By Module */}
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    تحديد مصفوفة الصلاحيات من وحدات النظام:
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    تم اختيار ({newRoleSelectedPerms.length}) صلاحية قياسية
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const all = PERMISSION_MODULES_AR.flatMap((m) =>
                        m.permissions.map((p) => p.code)
                      );
                      setNewRoleSelectedPerms(all);
                    }}
                    className="text-[11px] font-bold text-brand hover:underline px-2 py-1 rounded bg-brandSoft"
                  >
                    تحديد كافة الصلاحيات
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoleSelectedPerms([])}
                    className="text-[11px] font-bold text-rose-700 hover:underline px-2 py-1 rounded bg-rose-50"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {PERMISSION_MODULES_AR.map((mod) => (
                  <div
                    key={mod.id}
                    className="border border-line rounded-xl p-3 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-ink">
                        {mod.nameAr}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const modCodes = mod.permissions.map((p) => p.code);
                          const allInMod = modCodes.every((c) =>
                            newRoleSelectedPerms.includes(c)
                          );
                          if (allInMod) {
                            setNewRoleSelectedPerms((prev) =>
                              prev.filter((c) => !modCodes.includes(c))
                            );
                          } else {
                            setNewRoleSelectedPerms((prev) =>
                              Array.from(new Set([...prev, ...modCodes]))
                            );
                          }
                        }}
                        className="text-[10px] font-bold text-slate-600 hover:text-ink cursor-pointer"
                      >
                        تبديل الوحدة
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mod.permissions.map((perm) => {
                        const checked = newRoleSelectedPerms.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? "bg-brandSoft border-brandBorder text-brandInk font-bold shadow-sm"
                                : "bg-white border-line text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRoleSelectedPerms((prev) => [
                                    ...prev,
                                    perm.code,
                                  ]);
                                } else {
                                  setNewRoleSelectedPerms((prev) =>
                                    prev.filter((c) => c !== perm.code)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded text-brand focus:ring-brand"
                            />
                            <div className="flex-1">
                              <span className="block text-[11px] font-bold">
                                {perm.labelAr}
                              </span>
                              <span className="block text-[9px] font-mono text-slate-500">
                                {perm.code}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free-form Manual Permissions Textarea */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <label className="block text-xs font-bold text-ink">
                إدخال صلاحيات يدوية حرة (Manual Free-form Permissions):
              </label>
              <textarea
                rows={2}
                dir="ltr"
                placeholder="audit:custom:export, finance:invoices:read, tenant:custom:action"
                value={newRoleCustomManualPerms}
                onChange={(e) => setNewRoleCustomManualPerms(e.target.value)}
                className="w-full rounded-xl border border-line p-2 text-xs font-mono bg-slate-50 text-ink focus:border-brand focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                اكتب أي صلاحيات إضافية مخصصة مفصولة بفواصل أو أسطر جديدة ليتم اعتمادها فوراً للدور.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand to-brandInk hover:opacity-95 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                حفظ وتفعيل الدور الجديد في قاعدة البيانات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: Edit Role Permissions Modal                                  */}
      {/* ===================================================================== */}
      {editingRole && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleUpdateRoleSubmit}
            className="bg-white rounded-2xl border border-line max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[11px] font-bold text-brand bg-brandSoft px-2.5 py-0.5 rounded-full border border-brandBorder">
                  تعديل مصفوفة الصلاحيات
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-ink mt-1">
                  تعديل صلاحيات الدور: {editingRole.nameAr} ({editingRole.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  اسم الدور باللغة العربية
                </label>
                <input
                  type="text"
                  required
                  value={editRoleNameAr}
                  onChange={(e) => setEditRoleNameAr(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2 text-xs font-bold bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  الوصف والمسؤوليات
                </label>
                <input
                  type="text"
                  value={editRoleDescAr}
                  onChange={(e) => setEditRoleDescAr(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2 text-xs bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist of Permissions */}
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    تعديل الصلاحيات الممنوحة لهذا الدور:
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    تم اعتماد ({editRoleSelectedPerms.length}) صلاحية حتى الآن
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const all = PERMISSION_MODULES_AR.flatMap((m) =>
                        m.permissions.map((p) => p.code)
                      );
                      setEditRoleSelectedPerms(all);
                    }}
                    className="text-[11px] font-bold text-brand hover:underline px-2 py-1 rounded bg-brandSoft"
                  >
                    تحديد كل الصلاحيات
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRoleSelectedPerms([])}
                    className="text-[11px] font-bold text-rose-700 hover:underline px-2 py-1 rounded bg-rose-50"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {PERMISSION_MODULES_AR.map((mod) => (
                  <div
                    key={mod.id}
                    className="border border-line rounded-xl p-3 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-ink">
                        {mod.nameAr}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const modCodes = mod.permissions.map((p) => p.code);
                          const allInMod = modCodes.every((c) =>
                            editRoleSelectedPerms.includes(c)
                          );
                          if (allInMod) {
                            setEditRoleSelectedPerms((prev) =>
                              prev.filter((c) => !modCodes.includes(c))
                            );
                          } else {
                            setEditRoleSelectedPerms((prev) =>
                              Array.from(new Set([...prev, ...modCodes]))
                            );
                          }
                        }}
                        className="text-[10px] font-bold text-slate-600 hover:text-ink cursor-pointer"
                      >
                        تبديل الوحدة
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mod.permissions.map((perm) => {
                        const checked = editRoleSelectedPerms.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? "bg-brandSoft border-brandBorder text-brandInk font-bold shadow-sm"
                                : "bg-white border-line text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditRoleSelectedPerms((prev) => [
                                    ...prev,
                                    perm.code,
                                  ]);
                                } else {
                                  setEditRoleSelectedPerms((prev) =>
                                    prev.filter((c) => c !== perm.code)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded text-brand focus:ring-brand"
                            />
                            <div className="flex-1">
                              <span className="block text-[11px] font-bold">
                                {perm.labelAr}
                              </span>
                              <span className="block text-[9px] font-mono text-slate-500">
                                {perm.code}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free-form Manual Permissions Textarea */}
            <div className="space-y-1.5 pt-2 border-t border-line">
              <label className="block text-xs font-bold text-ink">
                صلاحيات يدوية حرة إضافية لهذا الدور:
              </label>
              <textarea
                rows={2}
                dir="ltr"
                placeholder="audit:custom:export, extra:action:code"
                value={editRoleCustomManualPerms}
                onChange={(e) => setEditRoleCustomManualPerms(e.target.value)}
                className="w-full rounded-xl border border-line p-2 text-xs font-mono bg-slate-50 text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brandInk text-white text-xs font-bold cursor-pointer shadow-md"
              >
                حفظ التعديلات في قاعدة البيانات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 7: Instant Beneficiary Registration Modal                       */}
      {/* ===================================================================== */}
      {showCreateBeneficiaryModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateBeneficiarySubmit}
            className="bg-white rounded-2xl border border-line max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  تسجيل فوري مباشر للمستفيد
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-ink mt-1">
                  تسجيل مستفيد جديد وإنشاء ملف بحث اجتماعي شامل (360° Profile)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBeneficiaryModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  الرقم القومي المصري للمستفيد (14 رقماً - المعرّف الأساسي) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  maxLength={14}
                  placeholder="29501010101234"
                  value={benNid}
                  onChange={(e) =>
                    setBenNid(e.target.value.replace(/\D/g, "").slice(0, 14))
                  }
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-mono font-bold bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  الاسم الرباعي كاملاً (كما في بطاقة الرقم القومي) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاطمة عبد الفتاح السيد البدوي"
                  value={benFullName}
                  onChange={(e) => setBenFullName(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-bold bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  رقم الهاتف المحمول المصري (للتواصل وتوثيق الدخول) *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="01012345678"
                  value={benMobile}
                  onChange={(e) => setBenMobile(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-mono bg-white text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  المحافظة
                </label>
                <select
                  value={benGov}
                  onChange={(e) => setBenGov(e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-xs font-bold bg-white text-ink focus:border-brand focus:outline-none cursor-pointer"
                >
                  {[
                    "القاهرة", "الجيزة", "القليوبية", "الإسكندرية", "الغربية",
                    "الشرقية", "الدقهلية", "المنوفية", "كفر الشيخ", "البحيرة",
                    "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء",
                    "جنوب سيناء", "بني سويف", "الفيوم", "المنيا", "أسيوط",
                    "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر",
                    "الوادي الجديد", "مطروح"
                  ].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                العنوان التفصيلي ومحل الإقامة
              </label>
              <input
                type="text"
                placeholder="المركز، الحي / القرية، الشارع، علامة مميزة"
                value={benAddress}
                onChange={(e) => setBenAddress(e.target.value)}
                className="w-full rounded-xl border border-line px-3.5 py-2 text-xs bg-white text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-ink">
                  الحالة الاجتماعية
                </label>
                <select
                  value={benMarital}
                  onChange={(e) => setBenMarital(e.target.value)}
                  className="w-full rounded-xl border border-line px-2 py-2 text-xs bg-white text-ink"
                >
                  <option value="معيل لأسرة">معيل لأسرة</option>
                  <option value="أرملة تعول">أرملة تعول</option>
                  <option value="مطلق / مطلقة">مطلق / مطلقة</option>
                  <option value="يتيم">يتيم</option>
                  <option value="مسن / عاجز">مسن / عاجز</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-ink">
                  عدد أفراد الأسرة
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={benFamilyCount}
                  onChange={(e) => setBenFamilyCount(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-line px-2 py-2 text-xs text-center font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-ink">
                  الدخل الشهري (ج.م)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={benIncome}
                  onChange={(e) => setBenIncome(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-line px-2 py-2 text-xs text-center font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-ink">
                  نوع السكن
                </label>
                <select
                  value={benHousing}
                  onChange={(e) => setBenHousing(e.target.value)}
                  className="w-full rounded-xl border border-line px-2 py-2 text-xs bg-white text-ink"
                >
                  <option value="إيجار عادي">إيجار عادي</option>
                  <option value="إيجار قديم">إيجار قديم</option>
                  <option value="ملك متوارث">ملك متوارث</option>
                  <option value="بيت ريفي طيني">بيت ريفي طيني</option>
                  <option value="غرفة مشتركة">غرفة مشتركة</option>
                </select>
              </div>
            </div>

            {/* Optional Login Account for Beneficiary */}
            <div className="bg-slate-50 border border-line rounded-xl p-3.5 space-y-2.5">
              <span className="block text-xs font-bold text-ink">
                بيانات حساب الدخول للمستفيد (اختياري - يتيح للمستفيد متابعة مساعداته بنفسه):
              </span>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    البريد الإلكتروني (Email)
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="name@domain.com (اختياري)"
                    value={benEmail}
                    onChange={(e) => setBenEmail(e.target.value)}
                    className="w-full rounded-xl border border-line px-3 py-1.5 text-xs font-mono bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600">
                    كلمة المرور (Password)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showBenPassword ? "text" : "password"}
                      dir="ltr"
                      placeholder="Sanad@2026 (تلقائي إن ترك فارغاً)"
                      value={benPassword}
                      onChange={(e) => setBenPassword(e.target.value)}
                      className="w-full rounded-xl border border-line px-3 py-1.5 text-xs font-mono bg-white pl-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBenPassword((p) => !p)}
                      className="absolute left-1.5 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                    >
                      {showBenPassword ? "إخفاء" : "إظهار"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowCreateBeneficiaryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:opacity-95 text-white text-xs font-bold cursor-pointer shadow-md"
              >
                تسجيل المستفيد وحفظ البروفايل الشامل
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
