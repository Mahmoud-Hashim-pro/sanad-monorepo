"use client";

import React, { useState } from "react";
import {
  type Beneficiary360Profile,
  findOrCreateBeneficiaryProfile,
} from "../lib/mock-data/beneficiaries-data";

interface BeneficiarySearchBarProps {
  beneficiaryProfiles: Beneficiary360Profile[];
  onSelectBeneficiary: (profile: Beneficiary360Profile) => void;
  titleAr?: string;
  subtitleAr?: string;
}

export function BeneficiarySearchBar({
  beneficiaryProfiles,
  onSelectBeneficiary,
  titleAr = "محرك الاستعلام والبحث المركزي عن المستفيدين بالخدمة",
  subtitleAr = "ابحث بالرقم القومي (14 رقماً)، برقم الهاتف المحمول، أو بالاسم للوصول الفوري لملف المستفيد الشامل (360°) وسجل المساعدات",
}: BeneficiarySearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Filter matching profiles
  const matchingProfiles = cleanQuery
    ? beneficiaryProfiles.filter((p) => {
        const q = cleanQuery.replace(/[^0-9a-zA-Z\u0600-\u06FF]/g, "");
        const nat = p.nationalId.replace(/[^0-9]/g, "");
        const phone = (p.primaryPhone + (p.alternativePhone || "")).replace(/[^0-9]/g, "");
        const name = p.fullNameAr.toLowerCase();
        const email = (p.email || "").toLowerCase();

        return (
          nat.includes(q) ||
          phone.includes(q) ||
          name.includes(cleanQuery) ||
          email.includes(cleanQuery)
        );
      })
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanQuery) return;

    if (matchingProfiles.length > 0) {
      onSelectBeneficiary(matchingProfiles[0]);
      setShowResults(false);
    } else {
      // Find or synthesize profile for this query
      const isNum = /^[0-9]+$/.test(cleanQuery);
      const isPhone = cleanQuery.startsWith("01") || cleanQuery.startsWith("+20");
      const found = findOrCreateBeneficiaryProfile(
        {
          nationalId: isNum && cleanQuery.length >= 10 ? cleanQuery : undefined,
          phone: isPhone ? cleanQuery : undefined,
          name: !isNum ? cleanQuery : undefined,
        },
        beneficiaryProfiles
      );
      if (found) {
        onSelectBeneficiary(found);
        setShowResults(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[11px] text-purple-200 font-bold mb-1">
            <span>🔍</span>
            <span>استعلام مركزي فوري (Beneficiary Central Intelligence)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            {titleAr}
          </h2>
          <p className="text-xs text-purple-200/80 mt-0.5 max-w-3xl">
            {subtitleAr}
          </p>
        </div>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 pointer-events-none text-base">
              🔎
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="أدخل الرقم القومي (14 رقماً)، أو رقم الهاتف المحمول (مثال: 01233344455)، أو اسم المستفيد..."
              className="w-full rounded-2xl bg-white text-slate-900 pr-11 pl-4 py-3.5 text-xs sm:text-sm font-semibold shadow-inner border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            <span>بحث فوري</span>
            <span>⚡</span>
          </button>
        </div>

        {/* Live Dropdown Results */}
        {showResults && cleanQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 z-40 max-h-80 overflow-y-auto p-2 space-y-1.5 text-right animate-in fade-in slide-in-from-top-2 duration-150">
            {matchingProfiles.length > 0 ? (
              matchingProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectBeneficiary(p);
                    setShowResults(false);
                  }}
                  className="p-3 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-200 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {p.fullNameAr}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold">
                        {p.age} سنة • {p.maritalStatusAr}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                        {p.researchContact.decisionAr}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-mono">
                      <span>الرقم القومي: <strong className="text-slate-700">{p.nationalId}</strong></span>
                      <span>الهاتف: <strong className="text-purple-700">{p.primaryPhone}</strong></span>
                      <span className="font-sans text-slate-600">
                        📍 {p.housing.governorate} - {p.housing.cityOrCenterAr} ({p.housing.districtOrVillageAr})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBeneficiary(p);
                      setShowResults(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer shadow-sm transition"
                  >
                    عرض الملف الشامل (360°)
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-slate-600">
                  لم يتم العثور على مستفيد مطابق لكلمة البحث: <strong>"{searchQuery}"</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const isNum = /^[0-9]+$/.test(cleanQuery);
                    const isPhone = cleanQuery.startsWith("01") || cleanQuery.startsWith("+20");
                    const p = findOrCreateBeneficiaryProfile(
                      {
                        nationalId: isNum && cleanQuery.length >= 10 ? cleanQuery : undefined,
                        phone: isPhone ? cleanQuery : undefined,
                        name: !isNum ? cleanQuery : undefined,
                      },
                      beneficiaryProfiles
                    );
                    if (p) {
                      onSelectBeneficiary(p);
                      setShowResults(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  فتح وإنشاء ملف مستفيد جديد بهذه البيانات (360°)
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
