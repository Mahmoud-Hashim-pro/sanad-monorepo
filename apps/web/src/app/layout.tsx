import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sanad-ten-sigma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "منصة سَنَد (SANAD) | إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي",
    template: "%s | منصة سَنَد (SANAD)",
  },
  description:
    "منصة سحابية عربية متعددة المستأجرين لإدارة الجمعيات الخيرية والمبادرات الفردية، البحث الاجتماعي الميداني، التخصيص المالي الذري للتبرعات، وتوثيق تسليم المساعدات بالرقم القومي المصري.",
  keywords: [
    "منصة سند",
    "SANAD",
    "إدارة الجمعيات الخيرية",
    "المبادرات الفردية",
    "البحث الاجتماعي الميداني",
    "تكافل اجتماعي",
    "الرقم القومي المصري",
    "تخصيص التبرعات",
    "توثيق المساعدات",
    "مصر",
  ],
  authors: [{ name: "فريق هندسة منصة سَنَد (SANAD Platform Engineering)" }],
  creator: "SANAD Social Impact Platform",
  publisher: "SANAD",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "/",
    languages: {
      "ar-EG": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: siteUrl,
    siteName: "منصة سَنَد (SANAD)",
    title: "منصة سَنَد (SANAD) | الحوكمة الرقمية للعمل الخيري والبحث الاجتماعي",
    description:
      "منظومة متكاملة لعزل بيانات الجمعيات والمبادرات، فصل المهام الرقابية في البحث الاجتماعي، والتخصيص المالي الذري للتبرعات.",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة سَنَد (SANAD) | إدارة الجمعيات الخيرية والمبادرات الفردية",
    description:
      "منصة سحابية عربية متعددة المستأجرين لإدارة الحالات، البحث الاجتماعي، التبرعات، وتوثيق تسليم المساعدات.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "منصة سَنَد (SANAD)",
      alternateName: "SANAD Charity & Social Research Platform",
      url: siteUrl,
      inLanguage: "ar-EG",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      description:
        "منصة سحابية عربية متعددة المستأجرين لإدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي الميداني وتوثيق المساعدات.",
      featureList: [
        "عزل كامل للبيانات بين الجمعيات الخيرية والمبادرات الفردية (Multi-Tenant Isolation)",
        "فصل المهام الرقابية بين الباحث الميداني ومشرف البحث الاجتماعي (Separation of Duties)",
        "التخصيص المالي الذري للتبرعات المقيدة وغير المقيدة (Atomic Donation Allocation)",
        "التحقق من الرقم القومي المصري وتطبيع أرقام الهواتف المحمولة E.164",
      ],
    },
    {
      "@type": "Organization",
      name: "منصة سَنَد للتكافل والحوكمة الاجتماعية",
      url: siteUrl,
      areaServed: {
        "@type": "Country",
        name: "Egypt",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-purple-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
