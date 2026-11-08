#!/usr/bin/env bash
set -euo pipefail

echo "======================================================"
echo "  منصة سَنَد (SANAD) — أداة النشر السحابي (Publish CLI)"
echo "======================================================"

MODE="${1:-vercel}"

if [ "$MODE" = "vercel" ]; then
  if ! command -v vercel >/dev/null 2>&1; then
    echo "جاري تثبيت Vercel CLI..."
    npm i -g vercel
  fi
  echo "بدء نشر واجهة المعاينة التفاعلية على Vercel..."
  vercel --prod --yes
elif [ "$MODE" = "docker" ]; then
  echo "بدء بناء وتشغيل حاويات الإنتاج (Docker Compose Production)..."
  docker compose -f docker-compose.prod.yml up -d --build
  echo "تم التشغيل بنجاح:"
  echo "  - الواجهة الأمامية (Next.js): http://localhost:3000"
  echo "  - الواجهة الخلفية (NestJS API): http://localhost:4000/api/v1"
else
  echo "الاستخدام: ./scripts/publish-preview.sh [vercel|docker]"
  exit 1
fi
