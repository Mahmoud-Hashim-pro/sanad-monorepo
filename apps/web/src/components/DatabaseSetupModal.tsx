"use client";

import React, { useState, useEffect } from "react";

interface HealthResponse {
  status: string;
  platform: string;
  databaseUrlConfigured: boolean;
  mode: string;
  tablesCount: number;
  timestamp: string;
}

interface DatabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (message: string, type?: "success" | "warning" | "error") => void;
}

const PROVIDER_TEMPLATES: Record<
  string,
  { labelAr: string; envSnippet: string; instructionsAr: string }
> = {
  NEON: {
    labelAr: "Neon Serverless Postgres (موصى به مع Vercel)",
    envSnippet: `DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-darkness-123456.eu-central-1.aws.neon.tech/sanad_prod?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-darkness-123456.eu-central-1.aws.neon.tech/sanad_prod?sslmode=require"
JWT_ACCESS_SECRET="sanad-prod-jwt-access-secret-min-32-chars"
JWT_REFRESH_SECRET="sanad-prod-jwt-refresh-secret-min-32-chars"`,
    instructionsAr:
      "انسخ رابط الاتصال من لوحة تحكم Neon وأضفه في إعدادات Environment Variables على Vercel أو في ملف .env، ثم شغّل أمر الترحيل.",
  },
  SUPABASE: {
    labelAr: "Supabase PostgreSQL (Connection Pooler + Direct)",
    envSnippet: `DATABASE_URL="postgresql://postgres.projectref:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.projectref:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"`,
    instructionsAr:
      "استخدم منفذ 6543 مع pgbouncer=true لـ DATABASE_URL ومنفذ 5432 لـ DIRECT_URL الخاص بترحيل الجداول (Migrations).",
  },
  DOCKER: {
    labelAr: "Docker Compose Local PostgreSQL 16",
    envSnippet: `DATABASE_URL="postgresql://sanad:sanad_local_pass@localhost:5432/sanad_db?schema=public"`,
    instructionsAr:
      "شغّل الحاوية المحلية عبر docker compose up -d postgres ثم نفّذ pnpm db:push لبناء الجداول الـ 39.",
  },
};

export function DatabaseSetupModal({
  isOpen,
  onClose,
  onNotify,
}: DatabaseSetupModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>("NEON");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as HealthResponse;
      setHealthData(data);
      onNotify(
        `تم فحص نقطة الاتصال /api/health بنجاح — الوضع الحالي: ${
          data.databaseUrlConfigured ? "متصل بـ PostgreSQL" : "التخزين التفاعلي الفوري"
        }`,
        "success"
      );
    } catch {
      onNotify("تعذر الاتصال بنقطة الفحص /api/health", "error");
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (isOpen && !healthData) {
      void checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProvider = PROVIDER_TEMPLATES[selectedProvider] || PROVIDER_TEMPLATES.NEON;

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`تم نسخ ${label} إلى الحافظة بنجاح`, "success");
    } catch {
      onNotify("تم تحديد النص؛ يمكنك نسخه يدوياً", "warning");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="db-setup-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full">
              PostgreSQL 16 • Prisma ORM • 39 Models
            </span>
            <h2 id="db-setup-modal-title" className="text-lg font-bold text-slate-900 mt-1.5">
              إعداد قاعدة البيانات والربط السحابي (Database & Cloud Connection)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              تعمل المنصة حالياً بكامل التفاعلية الفورية في المتصفح، وجاهزة للربط المباشر بقاعدة بيانات PostgreSQL عبر متغير البيئة <code className="font-mono bg-slate-100 px-1 rounded">DATABASE_URL</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة إعداد قاعدة البيانات"
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            إغلاق ✕
          </button>
        </div>

        {/* Live Health Status Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData?.status === "ok" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-bold text-slate-900">
                حالة الخادم (`/api/health`):{" "}
                {healthData ? (
                  <span className="text-emerald-700">
                    متصل ({healthData.mode === "postgresql_ready" ? "PostgreSQL Ready" : "Interactive Persistence + Prisma Schema Ready"})
                  </span>
                ) : (
                  "جاري الفحص..."
                )}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              عدد الجداول المعرّفة في <code className="font-mono">packages/database/prisma/schema.prisma</code>:{" "}
              <strong>{healthData?.tablesCount ?? 39} جدولاً</strong> موزعة على 13 وحدة معمارية معزولة.
            </p>
          </div>

          <button
            type="button"
            onClick={checkHealth}
            disabled={loadingHealth}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold transition disabled:opacity-50"
          >
            {loadingHealth ? "جاري فحص الاتصال..." : "فحص الاتصال (/api/health)"}
          </button>
        </div>

        {/* Cloud Provider Tabs */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            اختر مزود قاعدة البيانات السحابية لنسخ إعدادات الربط:
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROVIDER_TEMPLATES).map(([key, provider]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedProvider(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedProvider === key
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {provider.labelAr}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">.env / Vercel Environment Variables</span>
              <button
                type="button"
                onClick={() => copyText(currentProvider.envSnippet, "إعدادات DATABASE_URL")}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
              >
                نسخ الإعدادات
              </button>
            </div>
            <pre dir="ltr" className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-emerald-300">
              {currentProvider.envSnippet}
            </pre>
            <p className="text-xs text-slate-300 pt-1">{currentProvider.instructionsAr}</p>
          </div>
        </div>

        {/* CLI Migration Commands */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-purple-950">
              أوامر بناء الجداول الـ 39 وتوليد Prisma Client:
            </h3>
            <button
              type="button"
              onClick={() =>
                copyText(
                  "pnpm --filter @sanad/database prisma generate && pnpm --filter @sanad/database prisma db push",
                  "أوامر تهيئة قاعدة البيانات"
                )
              }
              className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium"
            >
              نسخ الأمر
            </button>
          </div>
          <code dir="ltr" className="block text-xs font-mono bg-white border border-purple-200 rounded-lg p-2.5 text-slate-800">
            pnpm --filter @sanad/database prisma generate &amp;&amp; pnpm --filter @sanad/database prisma db push
          </code>
        </div>
      </div>
    </div>
  );
}
