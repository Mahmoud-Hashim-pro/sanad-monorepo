# منصة سَنَد (SANAD) — نظام إدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي

منصة **سَنَد (SANAD)** هي منصة سحابية عربية (RTL أولاً) متعددة المستأجرين (Multi-Tenant Modular Monolith) لإدارة الأنشطة الخيرية، الحالات، الأبحاث الاجتماعية الميدانية، التبرعات النقدية والعينية، التخصيصات المالية، وتوثيق التسليم الفعلي للمساعدات مع بوابة خدمة ذاتية للمستفيدين.

## 1. هيكل المستودع (Monorepo Architecture)
```text
sanad-monorepo/
├── apps/
│   ├── web/                 # Next.js App Router + Tailwind CSS + shadcn/ui (Arabic RTL)
│   └── api/                 # NestJS Modular Monolith + REST /api/v1 + OpenAPI
├── packages/
│   ├── database/            # Prisma ORM Schema (39 tables) + Migrations + Fictional Seed
│   └── shared/              # Zod/TypeScript Validators (Egyptian National ID & E.164 Phone)
├── docs/
│   └── architecture/        # ERD, RBAC Matrix, API Contracts, Domain Workflows
├── docker-compose.yml       # PostgreSQL 16 Local Infrastructure
└── pnpm-workspace.yaml
```

## 2. المتطلبات المسبقة (Prerequisites)
- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0`
- **Docker & Docker Compose** (لتشغيل قاعدة بيانات PostgreSQL محلياً)

## 3. خطوات التشغيل المحلي (Local Setup & Run Commands)

```bash
# 1. نسخ ملف متغيرات البيئة
cp .env.example .env

# 2. تشغيل قاعدة بيانات PostgreSQL 16 عبر Docker Compose
docker compose up -d

# 3. تثبيت الحزم في جميع مساحات العمل
pnpm install

# 4. توليد Prisma Client وتطبيق المخطط الأولي
pnpm db:generate
pnpm db:migrate

# 5. زراعة البيانات الاختبارية الخيالية (Fictional Seed Data Only)
pnpm db:seed

# 6. تشغيل بيئة التطوير (الواجهة الأمامية + الواجهة الخلفية)
pnpm dev
```

## 4. أوامر الفحص والاختبار (Verification & Test Commands)
```bash
pnpm typecheck   # فحص أنواع TypeScript
pnpm lint        # فحص جودة الكود
pnpm test        # تشغيل اختبارات الوحدات والتحقق من الهوية المصرية والعمليات المالية
```

## 5. ضوابط الأمان والخصوصية في المرحلة الأولى (Sprint 1 Safeguards)
- **لا توجد مصادقة خلفية وهمية (No Fake Backend Auth):** الواجهة الأمامية تعمل في وضع معاينة واضح (`PREVIEW_MOCK_MODE`) ببيانات خيالية، بينما عقود التحقق الفعلي من عدم التكرار ورموز OTP مجهزة في طبقة الـ Backend ليتم ربطها بقاعدة البيانات.
- **التحقق الشكلي مقابل التفرد الفعلي:** التحقق من الرقم القومي (14 رقماً) في المتصفح يتحقق من الصيغة وتاريخ الميلاد وكود المحافظة فقط، ولا يُعد دليلاً على الهوية أو عدم التكرار في قاعدة البيانات.
