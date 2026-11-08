/**
 * SANAD Fictional Database Seed Script (Sprint 1)
 * IMPORTANT: Contains strictly fictional Arabic test data. No real National IDs or real PII.
 */
import { PrismaClient, TenantType, TenantStatus, RoleCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("بدء زراعة البيانات التجريبية الخيالية لمنصة سَنَد (SANAD Fictional Seed)...");

  const roles: { code: RoleCode; nameAr: string; descriptionAr: string }[] = [
    { code: "SUPER_ADMIN", nameAr: "مدير المنصة", descriptionAr: "إدارة اعتماد الجهات وإعدادات المنصة والتدقيق العام" },
    { code: "TENANT_ADMIN", nameAr: "مدير الجهة / المبادرة", descriptionAr: "إدارة المستفيدين والحالات والتبرعات والتخصيص والتسليم" },
    { code: "RESEARCH_SUPERVISOR", nameAr: "مشرف البحث الاجتماعي", descriptionAr: "توزيع ومراجعة الأبحاث الميدانية وتوصيات الاستحقاق" },
    { code: "VOLUNTEER", nameAr: "باحث / متطوع ميداني", descriptionAr: "تنفيذ الزيارات الميدانية وتوثيق تسليم المساعدات المسندة" },
    { code: "BENEFICIARY", nameAr: "مستفيد", descriptionAr: "بوابة الخدمة الذاتية لتقديم الطلبات ومتابعة سجل المساعدات الموثق" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { nameAr: r.nameAr, descriptionAr: r.descriptionAr },
      create: r,
    });
  }

  console.log("تم زراعة الأدوار الأساسية بنجاح.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
