"use client";

import React, { useState } from "react";
import {
  type Beneficiary360Profile,
  type BeneficiaryDependent,
  type PastAidRecord,
} from "../lib/mock-data/beneficiaries-data";

interface Beneficiary360ModalProps {
  profile: Beneficiary360Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (updatedProfile: Beneficiary360Profile) => void;
}

export function Beneficiary360Modal({
  profile,
  isOpen,
  onClose,
  onUpdateProfile,
}: Beneficiary360ModalProps) {
  const [activeTab, setActiveTab] = useState<
    "HOUSING" | "DEPENDENTS" | "FINANCIAL" | "RESEARCH" | "AIDS"
  >("HOUSING");

  // Local state for interactive updates
  const [newNote, setNewNote] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [showAddDependent, setShowAddDependent] = useState(false);
  const [depName, setDepName] = useState("");
  const [depRel, setDepRel] = useState("ابن");
  const [depAge, setDepAge] = useState(10);
  const [depEdu, setDepEdu] = useState("المرحلة الابتدائية");
  const [depHealth, setDepHealth] = useState("سليم صحياً");
  const [depDisability, setDepDisability] = useState(false);

  // New aid recording state
  const [showAddAid, setShowAddAid] = useState(false);
  const [aidCategory, setAidCategory] = useState("إعانة شهرية وسلة غذائية للأسرة");
  const [aidDesc, setAidDesc] = useState("كرتونة مواد غذائية كبرى");
  const [aidAmount, setAidAmount] = useState("750 ج.م");
  const [aidDonor, setAidDonor] = useState("جمعية النور للتكافل والتنمية الاجتماعية بطنطا");
  const [aidOfficerName, setAidOfficerName] = useState("محمود عزت النجار");
  const [aidOfficerPhone, setAidOfficerPhone] = useState("+201223344556");

  if (!isOpen || !profile) return null;

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    const updated = {
      ...profile,
      housing: {
        ...profile.housing,
        photoUrls: [...profile.housing.photoUrls, newPhotoUrl.trim()],
      },
    };
    onUpdateProfile?.(updated);
    setNewPhotoUrl("");
  };

  const handleAddDependentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depName.trim()) return;
    const newDep: BeneficiaryDependent = {
      id: `dep-${Date.now()}`,
      fullNameAr: depName.trim(),
      relationshipAr: depRel,
      age: Number(depAge),
      educationStageAr: depEdu,
      healthStatusAr: depHealth,
      hasDisabilityCard: depDisability,
      occupationAr: "طالب / تابع",
    };
    const updated = {
      ...profile,
      dependents: [...profile.dependents, newDep],
    };
    onUpdateProfile?.(updated);
    setDepName("");
    setShowAddDependent(false);
  };

  const handleAddAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aidDesc.trim() || !aidOfficerPhone.trim()) return;
    const newAid: PastAidRecord = {
      id: `aid-rec-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      categoryAr: aidCategory,
      descriptionAr: aidDesc.trim(),
      amountOrQuantityAr: aidAmount.trim(),
      donorTenantNameAr: aidDonor.trim(),
      disbursingOfficerNameAr: aidOfficerName.trim() || "مسؤول التوزيع الميداني",
      disbursingOfficerPhone: aidOfficerPhone.trim(),
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const updated = {
      ...profile,
      pastAids: [newAid, ...profile.pastAids],
    };
    onUpdateProfile?.(updated);
    setShowAddAid(false);
    setAidDesc("");
  };

  const handleAddResearchNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const nowIso = new Date().toISOString().slice(0, 10);
    const updated = {
      ...profile,
      researchContact: {
        ...profile.researchContact,
        fieldNotesAr: `${profile.researchContact.fieldNotesAr}\n\n[تحديث ميداني جديد بتاريخ ${nowIso}]: ${newNote.trim()}`,
      },
    };
    onUpdateProfile?.(updated);
    setNewNote("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beneficiary-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col text-right overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Beneficiary Essential Demographics */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق ملف المستفيد"
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-lg font-bold"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-3xl shadow-inner">
                {profile.genderAr === "أنثى" ? "🧕" : "👨"}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="beneficiary-profile-title"
                    className="text-xl sm:text-2xl font-black tracking-tight"
                  >
                    {profile.fullNameAr}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-purple-200 border border-purple-400/30 font-semibold">
                    {profile.age} سنة • {profile.maritalStatusAr}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    {profile.researchContact.decisionAr}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-purple-200/90 mt-1.5 font-mono">
                  <span>
                    الرقم القومي:{" "}
                    <strong className="text-white font-bold tracking-wider">
                      {profile.nationalId}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    الهاتف:{" "}
                    <a
                      href={`tel:${profile.primaryPhone}`}
                      className="text-amber-300 font-bold hover:underline"
                    >
                      {profile.primaryPhone}
                    </a>
                  </span>
                  {profile.alternativePhone && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">
                        بديل: {profile.alternativePhone}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="text-purple-100 font-sans">
                    {profile.housing.governorate} - {profile.housing.cityOrCenterAr}
                  </span>
                </div>
              </div>
            </div>

            {profile.tenantNameAr && (
              <div className="bg-white/10 rounded-xl px-3 py-1.5 border border-white/15 text-xs text-purple-100 hidden sm:block">
                <span className="text-purple-300 block text-[10px]">الجهة المشرفة:</span>
                <strong className="text-white">{profile.tenantNameAr}</strong>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 border-t border-white/10 pt-3 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("HOUSING")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "HOUSING"
                  ? "bg-white text-purple-950 shadow-md"
                  : "bg-white/10 text-purple-100 hover:bg-white/15"
              }`}
            >
              <span>🏠</span>
              <span>السكن والبيئة وصور المنزل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("DEPENDENTS")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "DEPENDENTS"
                  ? "bg-white text-purple-950 shadow-md"
                  : "bg-white/10 text-purple-100 hover:bg-white/15"
              }`}
            >
              <span>👨‍👩‍👧‍👦</span>
              <span>أفراد الأسرة والتابعين ({profile.dependents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FINANCIAL")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "FINANCIAL"
                  ? "bg-white text-purple-950 shadow-md"
                  : "bg-white/10 text-purple-100 hover:bg-white/15"
              }`}
            >
              <span>💰</span>
              <span>الموقف الاقتصادي والدخل والديون</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("RESEARCH")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "RESEARCH"
                  ? "bg-white text-purple-950 shadow-md"
                  : "bg-white/10 text-purple-100 hover:bg-white/15"
              }`}
            >
              <span>📋</span>
              <span>فريق البحث للتواصل المباشر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("AIDS")}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "AIDS"
                  ? "bg-white text-purple-950 shadow-md"
                  : "bg-white/10 text-purple-100 hover:bg-white/15"
              }`}
            >
              <span>🤝</span>
              <span>سجل المساعدات السابقة لمنع الازدواجية ({profile.pastAids.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* TAB 1: HOUSING & LIVING ENVIRONMENT */}
          {activeTab === "HOUSING" && (
            <div className="space-y-6">
              {/* Detailed Address and Location */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>📍</span>
                  <span>العنوان الدقيق وتحديد موقع السكن</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">المحافظة والمركز:</span>
                    <strong className="text-slate-900 font-bold">
                      {profile.housing.governorate} • {profile.housing.cityOrCenterAr}
                    </strong>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">القرية / الحي:</span>
                    <strong className="text-slate-900 font-bold">
                      {profile.housing.districtOrVillageAr}
                    </strong>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200 sm:col-span-2">
                    <span className="text-[11px] text-slate-500 block">الشارع والوصف:</span>
                    <strong className="text-slate-900 font-bold">
                      {profile.housing.streetAddressAr}
                    </strong>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2">
                  <span className="text-base">📌</span>
                  <div>
                    <strong className="font-bold block">علامة مميزة ونقطة دالة للوصول الميداني:</strong>
                    <span>{profile.housing.landmarkAr}</span>
                  </div>
                </div>
              </div>

              {/* Housing Structural Condition & Tenure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>🏚️</span>
                    <span>طبيعة الحيازة والحالة الإنشائية</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">نوع السكن والحيازة:</span>
                      <strong className="text-slate-900 font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg">
                        {profile.housing.tenureTypeAr}
                      </strong>
                    </div>
                    {profile.housing.monthlyRentEgp !== undefined && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                        <span className="text-slate-600">الإيجار الشهري المطلوب:</span>
                        <strong className="text-rose-700 font-bold font-mono">
                          {profile.housing.monthlyRentEgp.toLocaleString("ar-EG")} ج.م
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">حالة ونوع السقف:</span>
                      <strong className="text-slate-900 font-bold">
                        {profile.housing.roofTypeAr}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">حالة الجدران والحوائط:</span>
                      <strong className="text-slate-900 font-bold">
                        {profile.housing.wallConditionAr}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600">طبيعة الأرضيات:</span>
                      <strong className="text-slate-900 font-bold">
                        {profile.housing.floorTypeAr}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>🚰</span>
                    <span>المرافق الحيوية والبيئية</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💧</span>
                        <span className="font-bold text-slate-800">مياه شرب نظيفة متصلة</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          profile.housing.hasDrinkingWater
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {profile.housing.hasDrinkingWater ? "✓ متوفرة بالمسكن" : "✗ غير متوفرة / جلب من الخارج"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <span className="font-bold text-slate-800">عداد كهرباء نظامي</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          profile.housing.hasElectricityMeter
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {profile.housing.hasElectricityMeter ? "✓ متوفر (كارت / ممارسة)" : "✗ مقطوع / غير متوفر"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🚽</span>
                        <span className="font-bold text-slate-800">شبكة صرف صحي نظامية</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          profile.housing.hasSanitationSystem
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {profile.housing.hasSanitationSystem ? "✓ شبكة حكومية" : "⚠️ خزان تقليدي / بيارة متهالكة"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Gallery & Upload Section */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>🖼️</span>
                      <span>معرض الصور الميدانية الموثقة للمنزل</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      صور واجهة المسكن، الغرف، السقف، والمرافق للتوثيق الميداني والرقابي.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {profile.housing.photoUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video flex flex-col justify-end p-3 shadow-sm hover:shadow-md transition"
                    >
                      {/* Realistic Visual Representation Card */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-purple-950/30 flex items-center justify-center p-4 text-center">
                        <div className="space-y-1">
                          <span className="text-3xl opacity-80 block">
                            {idx === 0 ? "🏡" : idx === 1 ? "🪵" : "🛏️"}
                          </span>
                          <span className="text-[11px] text-slate-200 font-bold block">
                            {idx === 0
                              ? "معاينة واجهة المسكن والمدخل"
                              : idx === 1
                              ? "توثيق السقف الخشبي المتصدع"
                              : "حالة الغرف والفرش الداخلي"}
                          </span>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-between text-[10px] text-white/90 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                        <span>موثق ميدانياً بواسطة الباحث</span>
                        <span className="font-mono text-purple-300">#IMG-0{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form to add a new photo link */}
                <form
                  onSubmit={handleAddPhoto}
                  className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row gap-2 items-center"
                >
                  <label htmlFor="housing-photo-input" className="sr-only">
                    رابط أو مسار صورة المنزل الجديدة
                  </label>
                  <input
                    id="housing-photo-input"
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="أدخل رابط صورة المسكن الجديدة أو كود التوثيق (مثال: /photos/roof_inspect.jpg)..."
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 w-full"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer transition shadow-sm"
                  >
                    + إضافة صورة للمسكن
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: HOUSEHOLD & DEPENDENTS */}
          {activeTab === "DEPENDENTS" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <div>
                  <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <span>👨‍👩‍👧‍👦</span>
                    <span>سجل أفراد الأسرة والتابعين المقيمين بالمسكن</span>
                  </h3>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    إجمالي الأفراد المقيمين: <strong>{profile.dependents.length + 1} أفراد</strong> (المستفيد الأساسي + {profile.dependents.length} تابعين).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDependent(!showAddDependent)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer transition shadow-sm self-start sm:self-auto"
                >
                  {showAddDependent ? "إلغاء الإضافة" : "+ إضافة فرد / تابع جديد للأسرة"}
                </button>
              </div>

              {/* Form to Add New Dependent */}
              {showAddDependent && (
                <form
                  onSubmit={handleAddDependentSubmit}
                  className="bg-slate-50 rounded-2xl border border-purple-300 p-4 space-y-3 animate-in fade-in"
                >
                  <h4 className="font-bold text-slate-900 text-xs">إضافة بيانات فرد تابع للأسرة:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="dep-name-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        الاسم الرباعي للتابع *
                      </label>
                      <input
                        id="dep-name-input"
                        type="text"
                        required
                        value={depName}
                        onChange={(e) => setDepName(e.target.value)}
                        placeholder="اسم الابن أو التابع"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="dep-rel-select" className="block text-[11px] text-slate-600 font-bold mb-1">
                        صلة القرابة *
                      </label>
                      <select
                        id="dep-rel-select"
                        value={depRel}
                        onChange={(e) => setDepRel(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="ابن">ابن</option>
                        <option value="ابنة">ابنة</option>
                        <option value="زوجة">زوجة</option>
                        <option value="زوج">زوج</option>
                        <option value="والد">والد</option>
                        <option value="والدة">والدة</option>
                        <option value="أخ / أخت معاقة">أخ / أخت معاقة</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dep-age-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        السن (سنوات) *
                      </label>
                      <input
                        id="dep-age-input"
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={depAge}
                        onChange={(e) => setDepAge(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="dep-edu-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        المرحلة التعليمية
                      </label>
                      <input
                        id="dep-edu-input"
                        type="text"
                        value={depEdu}
                        onChange={(e) => setDepEdu(e.target.value)}
                        placeholder="مثال: الصف الثاني الإعدادي"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="dep-health-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        الحالة الصحية
                      </label>
                      <input
                        id="dep-health-input"
                        type="text"
                        value={depHealth}
                        onChange={(e) => setDepHealth(e.target.value)}
                        placeholder="سليم، مريض سكر، إعاقة..."
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="check-disability"
                        checked={depDisability}
                        onChange={(e) => setDepDisability(e.target.checked)}
                        className="rounded text-purple-600 cursor-pointer"
                      />
                      <label htmlFor="check-disability" className="text-slate-800 text-[11px] font-bold cursor-pointer">
                        يحمل كارت الخدمات المتكاملة (ذوي إعاقة)
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition shadow-sm"
                  >
                    حفظ التابع في سجل الأسرة
                  </button>
                </form>
              )}

              {/* Dependents Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-3">اسم الفرد</th>
                      <th className="p-3">صلة القرابة</th>
                      <th className="p-3">السن</th>
                      <th className="p-3">المستوى التعليمي</th>
                      <th className="p-3">الحالة الصحية والأمراض</th>
                      <th className="p-3">كارت الإعاقة</th>
                      <th className="p-3">العمل / المهنة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Head of household row */}
                    <tr className="border-b border-slate-100 bg-purple-50/50 font-semibold">
                      <td className="p-3 font-bold text-purple-950 flex items-center gap-1.5">
                        <span>⭐</span>
                        <span>{profile.fullNameAr} (رب الأسرة)</span>
                      </td>
                      <td className="p-3 text-purple-900 font-bold">المستفيد الأساسي</td>
                      <td className="p-3 font-mono">{profile.age} سنة</td>
                      <td className="p-3 text-slate-700">تقرأ وتكتب</td>
                      <td className="p-3 text-rose-800 font-bold">
                        أمراض مزمنة (سكر وربو شعبي)
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px]">لا يوجد</span>
                      </td>
                      <td className="p-3 text-slate-600">{profile.financial.incomeSourcesAr[1] || "عمل يدوي غير منتظم"}</td>
                    </tr>

                    {/* Dependents rows */}
                    {profile.dependents.map((dep) => (
                      <tr key={dep.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{dep.fullNameAr}</td>
                        <td className="p-3 text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">
                            {dep.relationshipAr}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">{dep.age} سنة</td>
                        <td className="p-3 text-slate-800">
                          <div>{dep.educationStageAr}</div>
                          {dep.educationExpensesEgp && (
                            <div className="text-[10px] text-rose-700 font-mono">
                              مصروفات: {dep.educationExpensesEgp} ج.م
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              dep.healthStatusAr.includes("سليم")
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {dep.healthStatusAr}
                          </span>
                        </td>
                        <td className="p-3">
                          {dep.hasDisabilityCard ? (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                              ✓ معتمد
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">لا يوجد</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{dep.occupationAr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL & ECONOMIC PROFILE */}
          {activeTab === "FINANCIAL" && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <span className="text-[11px] font-bold text-emerald-800 block">إجمالي الدخل الشهري الفعلي:</span>
                  <div className="text-2xl font-black font-mono mt-1 text-emerald-700">
                    {profile.financial.monthlyIncomeEgp.toLocaleString("ar-EG")} ج.م
                  </div>
                  <span className="text-[10px] text-emerald-800 block mt-1">
                    يشمل تكافل وكرامة واليوميات
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
                  <span className="text-[11px] font-bold text-rose-800 block">إجمالي المصروفات الحتمية:</span>
                  <div className="text-2xl font-black font-mono mt-1 text-rose-700">
                    {profile.financial.monthlyExpensesEgp.toLocaleString("ar-EG")} ج.م
                  </div>
                  <span className="text-[10px] text-rose-800 block mt-1">
                    إيجار، علاج مزمن، غذاء، ومدارس
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950">
                  <span className="text-[11px] font-bold text-amber-800 block">العجز المالي الشهري:</span>
                  <div className="text-2xl font-black font-mono mt-1 text-amber-900">
                    -{profile.financial.monthlyDeficitEgp.toLocaleString("ar-EG")} ج.م
                  </div>
                  <span className="text-[10px] text-amber-800 block mt-1">
                    فجوة الاحتياج الشهري لخط الكفاف
                  </span>
                </div>
              </div>

              {/* Income Sources & Expenses Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income Sources */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>💵</span>
                    <span>مصادر الدخل والمساندات الحكومية</span>
                  </h3>
                  <div className="space-y-2">
                    {profile.financial.incomeSourcesAr.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{src}</span>
                        <span className="text-emerald-700 font-bold font-mono">✓ معتمد</span>
                      </div>
                    ))}
                    {profile.financial.takafulAndKaramaAmountEgp && (
                      <div className="p-2.5 rounded-xl bg-emerald-100/60 border border-emerald-300 flex items-center justify-between text-emerald-950">
                        <span className="font-bold">معاش تكافل وكرامة بوزارة التضامن:</span>
                        <strong className="font-mono text-emerald-900 font-bold">
                          {profile.financial.takafulAndKaramaAmountEgp.toLocaleString("ar-EG")} ج.م / شهر
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expenses Breakdown */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>🧾</span>
                    <span>بيان المصروفات والالتزامات الحتمية</span>
                  </h3>
                  <div className="space-y-2">
                    {profile.financial.expenseBreakdownAr.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                      >
                        <span className="text-slate-800 font-semibold">{exp.itemAr}</span>
                        <strong className="font-mono text-rose-700 font-bold">
                          {exp.amountEgp.toLocaleString("ar-EG")} ج.م
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Debts & Gharimeen Status */}
              <div
                className={`rounded-2xl border p-4 space-y-2 ${
                  profile.financial.isIndebtedGharim
                    ? "bg-rose-50/80 border-rose-300"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚖️</span>
                    <h3 className="font-bold text-sm text-slate-900">
                      ملف ديون الغارمين والالتزامات القضائية
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                      profile.financial.isIndebtedGharim
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {profile.financial.isIndebtedGharim ? "⚠️ غارم / عليه ديون متأخرة" : "✓ لا توجد ديون مسجلة"}
                  </span>
                </div>

                {profile.financial.isIndebtedGharim && (
                  <div className="mt-2 space-y-2 text-rose-950">
                    <div className="text-xs">
                      إجمالي الديون المتراكمة:{" "}
                      <strong className="text-rose-700 font-mono font-bold text-sm">
                        {profile.financial.debtsTotalEgp?.toLocaleString("ar-EG")} ج.م
                      </strong>
                    </div>
                    {profile.financial.debtsNotesAr && (
                      <p className="bg-white/80 border border-rose-200 rounded-xl p-3 text-slate-800 text-xs">
                        {profile.financial.debtsNotesAr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL RESEARCH & TEAM CONTACTS */}
          {activeTab === "RESEARCH" && (
            <div className="space-y-6">
              {/* Field Researcher & Supervisor Direct Contact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field Volunteer Card */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-lg">
                      الباحث الميداني المسؤول (Field Investigator)
                    </span>
                    <span className="text-[10px] text-purple-700 font-mono">
                      الزيارة: {profile.researchContact.visitDate}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-base text-purple-950">
                      {profile.researchContact.volunteerNameAr}
                    </h4>
                    <span className="text-xs text-purple-700 block mt-0.5">
                      قام بالمعاينة الميدانية للأسرة وتصوير المسكن
                    </span>
                  </div>

                  <div className="pt-2 border-t border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-purple-600 block">رقم هاتف الباحث المباشر:</span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {profile.researchContact.volunteerPhone}
                      </strong>
                    </div>
                    <a
                      href={`tel:${profile.researchContact.volunteerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                    >
                      <span>📞</span>
                      <span>اتصال هاتفي</span>
                    </a>
                  </div>
                </div>

                {/* Supervisor Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold bg-indigo-200 text-indigo-900 px-2.5 py-0.5 rounded-lg">
                      مشرف البحث الاجتماعي (Research Supervisor)
                    </span>
                    <span className="text-[10px] text-indigo-700 font-mono">
                      الاعتماد: {profile.researchContact.approvalDate}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-base text-indigo-950">
                      {profile.researchContact.supervisorNameAr}
                    </h4>
                    <span className="text-xs text-indigo-700 block mt-0.5">
                      مراجعة التقرير واعتماد قرار الأهلية
                    </span>
                  </div>

                  <div className="pt-2 border-t border-indigo-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-600 block">رقم هاتف المشرف المباشر:</span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {profile.researchContact.supervisorPhone}
                      </strong>
                    </div>
                    <a
                      href={`tel:${profile.researchContact.supervisorPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                    >
                      <span>📞</span>
                      <span>اتصال هاتفي</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Field Report Assessment & Recommendations */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>📝</span>
                    <span>تقرير المعاينة الميدانية والتوصيات المعتمدة</span>
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                    القرار: {profile.researchContact.decisionAr}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                  {profile.researchContact.fieldNotesAr}
                </div>

                {profile.researchContact.recommendationsAr && (
                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-purple-950 text-xs">
                    <strong className="font-bold block mb-1">خطة التدخل المقترحة من فريق البحث:</strong>
                    <span>{profile.researchContact.recommendationsAr}</span>
                  </div>
                )}
              </div>

              {/* Form to submit a new field update */}
              <form
                onSubmit={handleAddResearchNote}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>✏️</span>
                  <span>تحديث دوري لتقرير البحث الاجتماعي (Field Update)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  يمكن للباحث الاجتماعي أو المشرف إضافة متابعة ميدانية جديدة (مثلاً: تغير المسكن، وفاة أو ولادة، تدهور صحي، أو تعديل قرار الاستحقاق).
                </p>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="أدخل نص التحديث الميداني الجديد..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer transition shadow-sm"
                >
                  حفظ التحديث الميداني وتوثيقه
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: CROSS-TENANT PAST AIDS & DISBURSEMENT AUDIT */}
          {activeTab === "AIDS" && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">🛡️</span>
                  <div>
                    <h3 className="font-bold text-sm">
                      السجل التاريخي الموحد للمساعدات (Cross-Tenant Anti-Duplicate Ledger)
                    </h3>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      يعرض كافة المساعدات التي استلمها المستفيد من كافة الجمعيات والمبادرات الشريكة لمنع ازدواجية الصرف وتوفير بيانات التواصل مع مسؤول كل عملية صرف.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAid(!showAddAid)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer transition shadow-sm shrink-0"
                >
                  {showAddAid ? "إلغاء التسجيل" : "+ تسجيل مساعدة منصرفة جديدة"}
                </button>
              </div>

              {/* Form to Record New Aid Delivery */}
              {showAddAid && (
                <form
                  onSubmit={handleAddAidSubmit}
                  className="bg-slate-50 rounded-2xl border border-amber-300 p-4 space-y-3 animate-in fade-in"
                >
                  <h4 className="font-bold text-xs text-slate-900">تسجيل تسليم مساعدة للمستفيد:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="aid-cat-select" className="block text-[11px] text-slate-600 font-bold mb-1">
                        نوع وبند المساعدة *
                      </label>
                      <select
                        id="aid-cat-select"
                        value={aidCategory}
                        onChange={(e) => setAidCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="إعانة شهرية وسلة غذائية للأسرة">إعانة شهرية وسلة غذائية للأسرة</option>
                        <option value="مساهمة في جراحة طبية عاجلة">مساهمة في جراحة طبية عاجلة</option>
                        <option value="أجهزة تعويضية وجلسات علاج طبيعي">أجهزة تعويضية وجلسات علاج طبيعي</option>
                        <option value="فك كرب وسداد ديون غارمين">فك كرب وسداد ديون غارمين</option>
                        <option value="كفالة تعليمية ومصروفات دراسية">كفالة تعليمية ومصروفات دراسية</option>
                        <option value="ترميم وتأهيل مسكن">ترميم وتأهيل مسكن</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="aid-desc-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        وصف المساعدة والكمية *
                      </label>
                      <input
                        id="aid-desc-input"
                        type="text"
                        required
                        value={aidDesc}
                        onChange={(e) => setAidDesc(e.target.value)}
                        placeholder="مثال: كرتونة مواد غذائية كبرى 25 كجم"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="aid-amount-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        القيمة التقديرية بالجنيه
                      </label>
                      <input
                        id="aid-amount-input"
                        type="text"
                        value={aidAmount}
                        onChange={(e) => setAidAmount(e.target.value)}
                        placeholder="مثال: 750 ج.م"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="aid-donor-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        الجهة المانحة (الجمعية / المبادرة)
                      </label>
                      <input
                        id="aid-donor-input"
                        type="text"
                        value={aidDonor}
                        onChange={(e) => setAidDonor(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="aid-officer-name-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        اسم مسؤول التسليم الفعلي *
                      </label>
                      <input
                        id="aid-officer-name-input"
                        type="text"
                        required
                        value={aidOfficerName}
                        onChange={(e) => setAidOfficerName(e.target.value)}
                        placeholder="اسم الموظف أو المتطوع المسلّم"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="aid-officer-phone-input" className="block text-[11px] text-slate-600 font-bold mb-1">
                        رقم هاتف مسؤول التسليم للتواصل *
                      </label>
                      <input
                        id="aid-officer-phone-input"
                        type="text"
                        dir="ltr"
                        required
                        value={aidOfficerPhone}
                        onChange={(e) => setAidOfficerPhone(e.target.value)}
                        placeholder="+201234567890"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs cursor-pointer transition shadow-sm"
                  >
                    توثيق المساعدة بالسجل الموحد
                  </button>
                </form>
              )}

              {/* Past Aids Ledger Cards/Table */}
              <div className="space-y-3">
                {profile.pastAids.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                    لم يتم تسجيل أي مساعدات منصرفة سابقة لهذا المستفيد حتى الآن.
                  </div>
                ) : (
                  profile.pastAids.map((aid) => (
                    <div
                      key={aid.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-purple-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {aid.categoryAr}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            تاريخ الصرف: {aid.date}
                          </span>
                          {aid.receiptNumber && (
                            <span className="font-mono text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                              إيصال: {aid.receiptNumber}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-700 text-xs">
                          {aid.descriptionAr} • القيمة: <strong className="text-emerald-700 font-mono">{aid.amountOrQuantityAr}</strong>
                        </p>

                        <div className="text-[11px] text-slate-500">
                          الجهة المانحة: <strong className="text-slate-800">{aid.donorTenantNameAr}</strong>
                        </div>
                      </div>

                      {/* Disbursement Officer Contact Card */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3 shrink-0">
                        <div>
                          <span className="text-[10px] text-slate-500 block">مسؤول التسليم للرجوع له:</span>
                          <strong className="text-slate-900 text-xs font-bold block">
                            {aid.disbursingOfficerNameAr}
                          </strong>
                          <span className="text-[11px] font-mono text-slate-600 block" dir="ltr">
                            {aid.disbursingOfficerPhone}
                          </span>
                        </div>
                        <a
                          href={`tel:${aid.disbursingOfficerPhone}`}
                          className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                        >
                          <span>📞</span>
                          <span>اتصال بالمسؤول</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono">
            معرّف المستفيد الموحد: <strong className="text-slate-700">{profile.id}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer transition shadow-sm"
          >
            إغلاق الملف
          </button>
        </div>
      </div>
    </div>
  );
}
