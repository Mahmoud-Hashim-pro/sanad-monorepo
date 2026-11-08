import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "منصة سَنَد (SANAD) | إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي",
  description: "منصة سحابية عربية متعددة المستأجرين لإدارة الحالات، البحث الاجتماعي، التبرعات، وتوثيق تسليم المساعدات",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
