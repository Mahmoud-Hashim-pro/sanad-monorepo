# دليل نشر منصة سَنَد (SANAD Deployment & Publish Guide)

يوضح هذا الدليل خطوات نشر منصة **سَنَد (SANAD)** سواء كبيئة معاينة تفاعلية سريعة (Preview Environment) أو كبيئة إنتاج كاملة (Full-Stack Production).

## الخيار الأول: النشر الفوري لواجهة المعاينة على Vercel (الأسرع للمراجعة)
1. فك ضغط أرشيف المستودع `sanad-sprint1-publish-ready.zip`.
2. شغّل الأمر التالي من جذر المشروع:
   ```bash
   npx vercel --prod
   ```
3. عند السؤال عن إعدادات المشروع:
   - **Root Directory**: `apps/web`
   - **Environment Variables**:
     - `NEXT_PUBLIC_APP_MODE=preview_mock`
4. سيعطيك Vercel رابطاً حقيقياً مباشراً فور انتهاء البناء (خلال ~60 ثانية).

## الخيار الثاني: نشر المنظومة الكاملة (Next.js + NestJS + PostgreSQL 16) على Render أو Railway
تم تضمين ملف البلوبرنت `render.yaml` في جذر المستودع:
1. ارفع الكود إلى مستودع GitHub خاص (`Private Repository`).
2. من لوحة تحكم **Render.com** اختر **New -> Blueprint** واربط المستودع.
3. سيقوم Render تلقائياً بإنشاء:
   - قاعدة بيانات `sanad-postgres` (PostgreSQL 16).
   - خدمة الخلفية `sanad-api` عبر `Dockerfile.api` مع توليد مفاتيح التشفير `NATIONAL_ID_HMAC_PEPPER` و`NATIONAL_ID_ENCRYPTION_KEY` تلقائياً.
   - خدمة الواجهة الأمامية `sanad-web-preview` عبر `Dockerfile.web`.

## الخيار الثالث: النشر الذاتي على خادم VPS (Ubuntu / Docker Compose)
```bash
cp .env.example .env
# قم بتعديل كلمات المرور ومفاتيح التشفير داخل .env
chmod +x scripts/publish-preview.sh
./scripts/publish-preview.sh docker
```
