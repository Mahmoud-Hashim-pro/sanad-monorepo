"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthNationalIdWorkspace } from "../../components/AuthNationalIdWorkspace";

export default function SanadLoginPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "warning" | "error" = "success"
  ) => {
    setToast({ message, type });
  };

  return (
    <main className="min-h-screen w-full bg-slate-900 relative">
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-xl mx-auto z-50">
          <div
            role="status"
            className={`rounded-2xl border px-4 py-3 text-xs font-bold shadow-lg flex items-center justify-between gap-3 ${
              toast.type === "success"
                ? "bg-emerald-900 text-emerald-50 border-emerald-700"
                : toast.type === "warning"
                ? "bg-amber-900 text-amber-50 border-amber-700"
                : "bg-rose-900 text-rose-50 border-rose-700"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="إغلاق الإشعار"
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <AuthNationalIdWorkspace
        fullScreenPage
        onNotify={showToast}
        onAuthenticatedSuccess={(payload) => {
          showToast(
            `مرحباً ${payload.fullNameAr}! تم توثيق الرقم القومي والبريد (${payload.email}) بنجاح — جاري توجيهك لمساحة العمل...`,
            "success"
          );
          setTimeout(() => {
            router.push(`/?view=${payload.targetRole}`);
          }, 900);
        }}
      />
    </main>
  );
}
