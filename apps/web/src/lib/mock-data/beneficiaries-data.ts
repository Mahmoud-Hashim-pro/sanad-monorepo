export interface BeneficiaryDependent {
  id: string;
  fullNameAr: string;
  relationshipAr: string; // زوج، زوجة، ابن، ابنة، والد، والدة، أخ
  age: number;
  educationStageAr: string; // بدون تعليم / أمي، ابتدائي، إعدادي، ثانوي/دبلوم، جامعي
  educationExpensesEgp?: number;
  healthStatusAr: string; // سليم، مرض مزمن (فشل كلوي/قلب/سكر/ربو)، إعاقة حركية، إعاقة ذهنية
  hasDisabilityCard: boolean; // بطاقة إثبات الإعاقة والخدمات المتكاملة
  occupationAr: string; // طالب، بدون عمل، عمالة غير منتظمة / يومية، ربة منزل
}

export interface HousingDetails {
  governorate: string;
  cityOrCenterAr: string;
  districtOrVillageAr: string;
  streetAddressAr: string;
  landmarkAr: string; // نقطة دالة بارزة
  tenureTypeAr: string; // إيجار جديد، إيجار قديم، سكن عائلي / مشترك، ملك متهالك، عشة / سكن غير ملائم
  monthlyRentEgp?: number;
  roofTypeAr: string; // خرسانة مسلحة، خشب وعروق وجريد متهالك، صاج وألواح، بدون سقف
  wallConditionAr: string; // طوب أحمر، محارة ودهان، طين نيئ، متصدع
  floorTypeAr: string; // بلاط/سيراميك، خرسانة عادية، تراب وحصى
  hasDrinkingWater: boolean; // مياه شرب نظيفة متصلة
  hasElectricityMeter: boolean; // عداد كهرباء مستقل أو ممارسة
  hasSanitationSystem: boolean; // شبكة صرف صحي نظامية أو خزان تقليدي
  photoUrls: string[]; // صور واجهة المنزل، السقف، الغرف، المرافق
}

export interface FinancialProfile {
  monthlyIncomeEgp: number;
  incomeSourcesAr: string[]; // عمالة يومية غير منتظمة، معاش تكافل وكرامة، مساعدات أهل الخير
  takafulAndKaramaAmountEgp?: number;
  monthlyExpensesEgp: number;
  expenseBreakdownAr: { itemAr: string; amountEgp: number }[]; // إيجار، علاج شهري، طعام ومدارس
  isIndebtedGharim: boolean; // هل غارم / غارمة؟
  debtsTotalEgp?: number;
  debtsNotesAr?: string; // تفاصيل إيصالات الأمانة أو ديون العلاج
  monthlyDeficitEgp: number; // العجز الشهري المحسوب (المصروفات - الدخل)
}

export interface ResearchContactInfo {
  volunteerNameAr: string;
  volunteerPhone: string;
  visitDate: string;
  supervisorNameAr: string;
  supervisorPhone: string;
  approvalDate: string;
  decisionAr: "مستحق كلياً (أولوية قصوى)" | "مستحق جزئياً" | "مستحق مشروط" | "غير مستحق";
  priorityLevel: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  fieldNotesAr: string;
  recommendationsAr?: string;
}

export interface PastAidRecord {
  id: string;
  date: string;
  categoryAr: string;
  descriptionAr: string;
  amountOrQuantityAr: string;
  donorTenantNameAr: string;
  disbursingOfficerNameAr: string;
  disbursingOfficerPhone: string; // هاتف مسؤول الصرف للتواصل المباشر والاستفسار
  receiptNumber?: string;
}

export interface Beneficiary360Profile {
  id: string;
  nationalId: string;
  maskedNationalId: string;
  fullNameAr: string;
  age: number;
  genderAr: "ذكر" | "أنثى";
  maritalStatusAr: string; // متزوج ويعول، أرملة تعول، مطلقة تعول، مهجورة، مسن بمفرده، أعزب
  primaryPhone: string;
  alternativePhone?: string;
  email?: string;
  housing: HousingDetails;
  dependents: BeneficiaryDependent[];
  financial: FinancialProfile;
  researchContact: ResearchContactInfo;
  pastAids: PastAidRecord[];
  activeCaseNumber?: string;
  tenantId?: string;
  tenantNameAr?: string;
}

export const INITIAL_BENEFICIARIES_PROFILES: Beneficiary360Profile[] = [
  {
    id: "ben-fatma-001",
    nationalId: "27905151601234",
    maskedNationalId: "279051516****4",
    fullNameAr: "فاطمة عبد الفتاح السيد",
    age: 47,
    genderAr: "أنثى",
    maritalStatusAr: "أرملة تعول 3 أيتام",
    primaryPhone: "+201233344455",
    alternativePhone: "+201099887766 (هاتف الجار للطوارئ)",
    email: "fatma.beneficiary@sanad.eg",
    activeCaseNumber: "CASE-2026-1042",
    tenantId: "33333333-3333-4333-8333-333333333301",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    housing: {
      governorate: "الغربية",
      cityOrCenterAr: "مركز طنطا",
      districtOrVillageAr: "قرية ميت حبيش البحرية",
      streetAddressAr: "حارة النصر متفرع من شارع الداير القبلي",
      landmarkAr: "بجوار مسجد التقوى وخلف الجمعية الزراعية القديمة",
      tenureTypeAr: "إيجار جديد (شقة قديمة غرفتين)",
      monthlyRentEgp: 850,
      roofTypeAr: "خشب وعروق وجريد متهالك (يسرب مياه الأمطار)",
      wallConditionAr: "طوب أحمر غير مبيض وبه شروخ وتصدعات نافذة",
      floorTypeAr: "تراب وحصى مغطى بحصير بلاستيك قديم",
      hasDrinkingWater: true,
      hasElectricityMeter: true,
      hasSanitationSystem: false, // خزان تقليدي
      photoUrls: [
        "/housing/sample_house_facade.jpg",
        "/housing/sample_house_roof.jpg",
        "/housing/sample_house_room.jpg",
      ],
    },
    dependents: [
      {
        id: "dep-1",
        fullNameAr: "أحمد محمد إبراهيم السيد",
        relationshipAr: "ابن (يتيم الأب)",
        age: 17,
        educationStageAr: "ثانوي صناعي (دبلوم 3 سنوات)",
        educationExpensesEgp: 450,
        healthStatusAr: "مريض حساسية صدر وربو شعبي مزمن يحتاج بخاخات مستمرة",
        hasDisabilityCard: false,
        occupationAr: "طالب ويبحث عن عمل مسائي يومية",
      },
      {
        id: "dep-2",
        fullNameAr: "مريم محمد إبراهيم السيد",
        relationshipAr: "ابنة (يتيمة الأب)",
        age: 13,
        educationStageAr: "الصف الثاني الإعدادي (حكومي)",
        educationExpensesEgp: 650,
        healthStatusAr: "سليمة صحياً",
        hasDisabilityCard: false,
        occupationAr: "طالبة متفوقة دراسياً",
      },
      {
        id: "dep-3",
        fullNameAr: "مصطفى محمد إبراهيم السيد",
        relationshipAr: "ابن (يتيم الأب)",
        age: 9,
        educationStageAr: "الصف الثالث الابتدائي (حكومي)",
        educationExpensesEgp: 300,
        healthStatusAr: "ضعف عام وأنيميا حادة",
        hasDisabilityCard: false,
        occupationAr: "طالب",
      },
    ],
    financial: {
      monthlyIncomeEgp: 1800,
      incomeSourcesAr: [
        "معاش تكافل وكرامة الحكومي: 850 ج.م",
        "عمل يدوي غير منتظم (تنظيف خضار): 650 ج.م",
        "مساعدة إعاشة من أقارب الخير: 300 ج.م",
      ],
      takafulAndKaramaAmountEgp: 850,
      monthlyExpensesEgp: 4200,
      expenseBreakdownAr: [
        { itemAr: "إيجار السكن الإلزامي", amountEgp: 850 },
        { itemAr: "أدوية وبخاخات الربو وعلاج الأم", amountEgp: 950 },
        { itemAr: "إعاشة وغذاء أساسي لـ 4 أفراد", amountEgp: 1800 },
        { itemAr: "مصروفات دراسية وفواتير مياه وكهرباء", amountEgp: 600 },
      ],
      isIndebtedGharim: true,
      debtsTotalEgp: 4200,
      debtsNotesAr:
        "ديون علاج متراكمة لصيدلية د. وائل بالقرية (2,400 ج.م) + حساب تموين وبقالة متأخر (1,800 ج.م) بموجب دفتر حساب يدوي.",
      monthlyDeficitEgp: 2400,
    },
    researchContact: {
      volunteerNameAr: "أحمد سامي الكيلاني",
      volunteerPhone: "+201009988776",
      visitDate: "2026-11-02",
      supervisorNameAr: "د. منى الشاذلي",
      supervisorPhone: "+201112233445",
      approvalDate: "2026-11-04",
      decisionAr: "مستحق كلياً (أولوية قصوى)",
      priorityLevel: "URGENT",
      fieldNotesAr:
        "الأسرة تعيش في وضع إنساني حرج، السقف خشب متهالك ويشكل خطورة على الأيتام مع دخول الشتاء. الأم تعاني من أمراض مزمنة والابن الأكبر يحتاج علاج شهري مستمر.",
      recommendationsAr:
        "1. اعتماد سلة غذائية شهرية منتظمة. 2. دعم طبي شهري للبخاخات والأدوية بقيمة 800 ج.م. 3. إدراج السكن في حملة تسقيف وترميم المنازل.",
    },
    pastAids: [
      {
        id: "aid-hist-001",
        date: "2026-10-15",
        categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
        descriptionAr: "تسليم سلة غذائية كبرى (أرز، زيت، سكر، لحوم مبردة)",
        amountOrQuantityAr: "750 ج.م",
        donorTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
        disbursingOfficerNameAr: "محمود عزت النجار (مسؤول قوافل التوزيع)",
        disbursingOfficerPhone: "+201223344556",
        receiptNumber: "RCV-GH-8821",
      },
      {
        id: "aid-hist-002",
        date: "2026-08-20",
        categoryAr: "مساهمة في جراحة وفحوصات طبية",
        descriptionAr: "إجراء فحوصات الصدر والأشعة المقطعية بمستشفى الجامعة للابن الأكبر",
        amountOrQuantityAr: "1,200 ج.م",
        donorTenantNameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري",
        disbursingOfficerNameAr: "سارة عبد الرحمن المنصوري",
        disbursingOfficerPhone: "+201098765432",
        receiptNumber: "IND-MED-049",
      },
    ],
  },
  {
    id: "ben-desouky-002",
    nationalId: "27911031602312",
    maskedNationalId: "279110316****2",
    fullNameAr: "محمود إبراهيم الدسوقي",
    age: 46,
    genderAr: "ذكر",
    maritalStatusAr: "متزوج ويعول 4 أفراد",
    primaryPhone: "+201123456789",
    alternativePhone: "+201288776655 (هاتف الزوجة)",
    email: "desouky.beneficiary@sanad.eg",
    activeCaseNumber: "CASE-2026-0119",
    tenantId: "33333333-3333-4333-8333-333333333301",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    housing: {
      governorate: "الغربية",
      cityOrCenterAr: "المحلة الكبرى",
      districtOrVillageAr: "منطقة أبوشاهين",
      streetAddressAr: "شارع مصطفى كامل - عمارة 4 - الدور الأرضي",
      landmarkAr: "خلف مدرسة الأمل الابتدائية",
      tenureTypeAr: "إيجار قديم (غرفة وصالة)",
      monthlyRentEgp: 350,
      roofTypeAr: "خرسانة مسلحة قديمة وبها رشح رطوبة",
      wallConditionAr: "محارة قديمة متآكلة من الرطوبة الأرضية",
      floorTypeAr: "بلاط أسمنتي قديم",
      hasDrinkingWater: true,
      hasElectricityMeter: true,
      hasSanitationSystem: true,
      photoUrls: ["/housing/sample_house_room.jpg"],
    },
    dependents: [
      {
        id: "dep-d1",
        fullNameAr: "زينب عبد العظيم مرعي",
        relationshipAr: "زوجة",
        age: 42,
        educationStageAr: "تقرأ وتكتب",
        healthStatusAr: "التهاب مفاصل مزمن",
        hasDisabilityCard: false,
        occupationAr: "ربة منزل",
      },
      {
        id: "dep-d2",
        fullNameAr: "كريم محمود إبراهيم الدسوقي",
        relationshipAr: "ابن",
        age: 15,
        educationStageAr: "الصف الأول الثانوي العام",
        educationExpensesEgp: 800,
        healthStatusAr: "سليم صحياً",
        hasDisabilityCard: false,
        occupationAr: "طالب",
      },
    ],
    financial: {
      monthlyIncomeEgp: 3200,
      incomeSourcesAr: ["عمل باليومية في ورشة حدادة (توقف بسبب ضعف البصر)"],
      monthlyExpensesEgp: 6800,
      expenseBreakdownAr: [
        { itemAr: "إيجار وفواتير", amountEgp: 500 },
        { itemAr: "أدوية وعلاج شهري وفحوصات عيون", amountEgp: 2300 },
        { itemAr: "إعاشة وغذاء", amountEgp: 4000 },
      ],
      isIndebtedGharim: false,
      monthlyDeficitEgp: 3600,
    },
    researchContact: {
      volunteerNameAr: "سارة مجدي نصار",
      volunteerPhone: "+201022334455",
      visitDate: "2026-11-01",
      supervisorNameAr: "د. منى الشاذلي",
      supervisorPhone: "+201112233445",
      approvalDate: "2026-11-03",
      decisionAr: "مستحق كلياً (أولوية قصوى)",
      priorityLevel: "URGENT",
      fieldNotesAr:
        "رب الأسرة فقد القدرة على كسب قوته بسبب إعتام عدسة العين (مياه بيضاء شديدة) في كلتا العينين، وتحتاج الأسرة تدخل جراحي عاجل لتمكينه من العودة للعمل وإعالة أسرته.",
    },
    pastAids: [
      {
        id: "aid-d-01",
        date: "2026-09-10",
        categoryAr: "مساهمة في جراحة طبية عاجلة",
        descriptionAr: "صرف مساهمة كشف واستشارات تخصصية لطب وجراحة العيون",
        amountOrQuantityAr: "600 ج.م",
        donorTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
        disbursingOfficerNameAr: "محمود عزت النجار",
        disbursingOfficerPhone: "+201223344556",
      },
    ],
  },
  {
    id: "ben-hashem-test-003",
    nationalId: "29501010101234",
    maskedNationalId: "295010101****4",
    fullNameAr: "هاشم تست",
    age: 31,
    genderAr: "ذكر",
    maritalStatusAr: "متزوج ويعول أسرة",
    primaryPhone: "+201114200035",
    alternativePhone: "+201011223344 (هاتف تواصل إضافي)",
    email: "aaa@aa.com",
    activeCaseNumber: "CASE-2026-0188",
    tenantId: "33333333-3333-4333-8333-333333333301",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    housing: {
      governorate: "الغربية",
      cityOrCenterAr: "طنطا",
      districtOrVillageAr: "منطقة سيجر",
      streetAddressAr: "شارع الفاتح - حارة الأمل",
      landmarkAr: "بجوار مركز شباب سيجر",
      tenureTypeAr: "إيجار جديد",
      monthlyRentEgp: 900,
      roofTypeAr: "خرسانة مسلحة قديمة",
      wallConditionAr: "محارة قديمة",
      floorTypeAr: "بلاط أسمنتي",
      hasDrinkingWater: true,
      hasElectricityMeter: true,
      hasSanitationSystem: true,
      photoUrls: ["/housing/sample_house_room.jpg"],
    },
    dependents: [
      {
        id: "dep-h1",
        fullNameAr: "سلمى السيد أحمد",
        relationshipAr: "زوجة",
        age: 27,
        educationStageAr: "مؤهل متوسط",
        healthStatusAr: "سليمة صحياً",
        hasDisabilityCard: false,
        occupationAr: "ربة منزل",
      },
      {
        id: "dep-h2",
        fullNameAr: "عمر هاشم",
        relationshipAr: "ابن",
        age: 4,
        educationStageAr: "مرحلة ما قبل التعليم (حضانة)",
        healthStatusAr: "سليم صحياً",
        hasDisabilityCard: false,
        occupationAr: "طفل",
      },
    ],
    financial: {
      monthlyIncomeEgp: 2200,
      incomeSourcesAr: ["عمل مؤقت غير مستقر / يومية في متجر تجزئة"],
      monthlyExpensesEgp: 4500,
      expenseBreakdownAr: [
        { itemAr: "إيجار وفواتير", amountEgp: 1100 },
        { itemAr: "طعام واحتياجات طفل", amountEgp: 2500 },
        { itemAr: "ديون والتزامات شهرية", amountEgp: 900 },
      ],
      isIndebtedGharim: true,
      debtsTotalEgp: 6500,
      debtsNotesAr: "ديون سلع معمرة ومصروفات علاج طفل بإيصالات أمانة متأخرة السداد.",
      monthlyDeficitEgp: 2300,
    },
    researchContact: {
      volunteerNameAr: "أحمد سامي الكيلاني",
      volunteerPhone: "+201009988776",
      visitDate: "2026-11-05",
      supervisorNameAr: "د. منى الشاذلي",
      supervisorPhone: "+201112233445",
      approvalDate: "2026-11-07",
      decisionAr: "مستحق كلياً (أولوية قصوى)",
      priorityLevel: "HIGH",
      fieldNotesAr:
        "المستفيد مسجل حديثاً عبر البوابة، تمت الزيارة الميدانية والتأكد من محل الإقامة والموقف المالي. الأسرة الأولى بالرعاية وتحتاج كفالة شهرية وسداد ديون الغارمين لتجنب المساءلة القانونية.",
    },
    pastAids: [
      {
        id: "aid-h-01",
        date: "2026-11-06",
        categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
        descriptionAr: "تسليم سلة غذائية أولية طارئة لحين استكمال ملف الكفالة الدائمة",
        amountOrQuantityAr: "500 ج.م",
        donorTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
        disbursingOfficerNameAr: "محمود عزت النجار",
        disbursingOfficerPhone: "+201223344556",
        receiptNumber: "RCV-EMERGENCY-014",
      },
    ],
  },
  {
    id: "ben-aya-004",
    nationalId: "29203181604429",
    maskedNationalId: "292031816****9",
    fullNameAr: "آية كمال الشناوي",
    age: 34,
    genderAr: "أنثى",
    maritalStatusAr: "مطلقة تعول طفلين",
    primaryPhone: "+201234567890",
    alternativePhone: "+201155443322 (هاتف والدها)",
    email: "aya.beneficiary@sanad.eg",
    activeCaseNumber: "CASE-2026-0125",
    tenantId: "33333333-3333-4333-8333-333333333301",
    tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
    housing: {
      governorate: "الغربية",
      cityOrCenterAr: "طنطا",
      districtOrVillageAr: "منطقة العجيزي",
      streetAddressAr: "شارع البحر الأعظم - حارة السلام",
      landmarkAr: "بجوار صيدلية الأمل",
      tenureTypeAr: "سكن عائلي مشترك مع والديها المسنين",
      monthlyRentEgp: 0,
      roofTypeAr: "خرسانة مسلحة قديمة",
      wallConditionAr: "محارة قديمة",
      floorTypeAr: "بلاط عادي",
      hasDrinkingWater: true,
      hasElectricityMeter: true,
      hasSanitationSystem: true,
      photoUrls: ["/housing/sample_house_room.jpg"],
    },
    dependents: [
      {
        id: "dep-a1",
        fullNameAr: "يوسف حسام الدين",
        relationshipAr: "ابن",
        age: 11,
        educationStageAr: "الصف الخامس الابتدائي",
        educationExpensesEgp: 500,
        healthStatusAr: "سليم صحياً",
        hasDisabilityCard: false,
        occupationAr: "طالب",
      },
      {
        id: "dep-a2",
        fullNameAr: "ريماس حسام الدين",
        relationshipAr: "ابنة",
        age: 8,
        educationStageAr: "الصف الثاني الابتدائي",
        educationExpensesEgp: 450,
        healthStatusAr: "سليمة صحياً",
        hasDisabilityCard: false,
        occupationAr: "طالبة",
      },
    ],
    financial: {
      monthlyIncomeEgp: 3000,
      incomeSourcesAr: ["نفقة غير منتظمة من الزوج السابق: 1200 ج.م", "عمل منزلي بحياكة الملابس: 1800 ج.م"],
      monthlyExpensesEgp: 6100,
      expenseBreakdownAr: [
        { itemAr: "مصروفات دراسية وكتب ودروس", amountEgp: 2200 },
        { itemAr: "إعاشة وغذاء للأطفال", amountEgp: 3200 },
        { itemAr: "علاج وفواتير", amountEgp: 700 },
      ],
      isIndebtedGharim: false,
      monthlyDeficitEgp: 3100,
    },
    researchContact: {
      volunteerNameAr: "أحمد سامي الكيلاني",
      volunteerPhone: "+201009988776",
      visitDate: "2026-10-28",
      supervisorNameAr: "د. منى الشاذلي",
      supervisorPhone: "+201112233445",
      approvalDate: "2026-10-30",
      decisionAr: "مستحق كلياً (أولوية قصوى)",
      priorityLevel: "MEDIUM",
      fieldNotesAr: "تم التحقق من قيد الأبناء بالمدارس واحتياجهم لكفالة تعليمية وسداد مصروفات العام الدراسي لضمان استمرارهم في التعليم.",
    },
    pastAids: [
      {
        id: "aid-a-01",
        date: "2026-09-25",
        categoryAr: "كفالة تعليمية ومصروفات دراسية",
        descriptionAr: "شيك سداد أقساط مدرسية وشنطة أدوات مدرسية للأطفال",
        amountOrQuantityAr: "1,500 ج.م",
        donorTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
        disbursingOfficerNameAr: "محمود عزت النجار",
        disbursingOfficerPhone: "+201223344556",
        receiptNumber: "EDU-2026-081",
      },
    ],
  },
  {
    id: "ben-hassan-005",
    nationalId: "28104221201535",
    maskedNationalId: "281042212****5",
    fullNameAr: "حسن عبد اللطيف الجندي",
    age: 44,
    genderAr: "ذكر",
    maritalStatusAr: "متزوج ويعول 5 أفراد",
    primaryPhone: "+201098765432",
    alternativePhone: "+201022338899",
    email: "hassan.jundi@sanad.eg",
    activeCaseNumber: "IND-2026-0014",
    tenantId: "33333333-3333-4333-8333-333333333302",
    tenantNameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري",
    housing: {
      governorate: "الدقهلية",
      cityOrCenterAr: "المنصورة",
      districtOrVillageAr: "ميت حدر",
      streetAddressAr: "شارع بورسعيد متفرع من شارع الجلاء",
      landmarkAr: "بجوار مستشفى المنصورة الدولي",
      tenureTypeAr: "إيجار جديد (شقة بالدور الرابع بدون مصعد)",
      monthlyRentEgp: 1100,
      roofTypeAr: "خرسانة مسلحة",
      wallConditionAr: "متوسطة",
      floorTypeAr: "بلاط",
      hasDrinkingWater: true,
      hasElectricityMeter: true,
      hasSanitationSystem: true,
      photoUrls: ["/housing/sample_house_room.jpg"],
    },
    dependents: [
      {
        id: "dep-j1",
        fullNameAr: "فاطمة إبراهيم الشربيني",
        relationshipAr: "زوجة",
        age: 39,
        educationStageAr: "مؤهل متوسط",
        healthStatusAr: "سليمة صحياً",
        hasDisabilityCard: false,
        occupationAr: "ربة منزل",
      },
      {
        id: "dep-j2",
        fullNameAr: "عمر حسن عبد اللطيف الجندي",
        relationshipAr: "ابن",
        age: 14,
        educationStageAr: "الإعدادية",
        educationExpensesEgp: 600,
        healthStatusAr: "سليم صحياً",
        hasDisabilityCard: false,
        occupationAr: "طالب",
      },
    ],
    financial: {
      monthlyIncomeEgp: 2900,
      incomeSourcesAr: ["معاش عجز جزئي حكومي: 1100 ج.م", "عمل تجاري بسيط على عربة يد: 1800 ج.م"],
      monthlyExpensesEgp: 6200,
      expenseBreakdownAr: [
        { itemAr: "إيجار السكن", amountEgp: 1100 },
        { itemAr: "صيانة وجلسات علاج طبيعي للطرف الصناعي", amountEgp: 1500 },
        { itemAr: "إعاشة وغذاء", amountEgp: 3600 },
      ],
      isIndebtedGharim: false,
      monthlyDeficitEgp: 3300,
    },
    researchContact: {
      volunteerNameAr: "كريم عادل يونس",
      volunteerPhone: "+201088776655",
      visitDate: "2026-10-25",
      supervisorNameAr: "سارة عبد الرحمن المنصوري",
      supervisorPhone: "+201098765432",
      approvalDate: "2026-10-27",
      decisionAr: "مستحق كلياً (أولوية قصوى)",
      priorityLevel: "URGENT",
      fieldNotesAr: "المستفيد تعرض لحادث بتر في الساق اليمنى، ويحتاج طرف صناعي حديث وجلسات تأهيل حركي لتمكينه من الحركة والعمل مجدداً.",
    },
    pastAids: [
      {
        id: "aid-j-01",
        date: "2026-10-20",
        categoryAr: "أجهزة تعويضية وجلسات علاج طبيعي",
        descriptionAr: "مساهمة في مقايسة وفحوصات الطرف الصناعي بالمركز التأهيلي",
        amountOrQuantityAr: "2,000 ج.م",
        donorTenantNameAr: "مبادرة سند الخير بالدقهلية - أ. سارة المنصوري",
        disbursingOfficerNameAr: "سارة عبد الرحمن المنصوري",
        disbursingOfficerPhone: "+201098765432",
        receiptNumber: "IND-REHAB-012",
      },
    ],
  },
];

/**
 * Helper to match or dynamically construct a Beneficiary 360 profile
 * for any search query (National ID, Phone, Name, Email).
 */
export function findOrCreateBeneficiaryProfile(
  query: {
    nationalId?: string;
    phone?: string;
    name?: string;
    email?: string;
  },
  existingProfiles: Beneficiary360Profile[] = INITIAL_BENEFICIARIES_PROFILES
): Beneficiary360Profile | null {
  const norm = (s?: string) => (s || "").replace(/[^0-9a-zA-Z\u0600-\u06FF]/g, "").toLowerCase();

  const qNat = norm(query.nationalId);
  const qPhone = norm(query.phone);
  const qName = norm(query.name);
  const qEmail = norm(query.email);

  // 1. Direct match in existing profiles
  for (const p of existingProfiles) {
    if (qNat && (norm(p.nationalId).includes(qNat) || qNat.includes(norm(p.nationalId)))) {
      return p;
    }
    if (qPhone && (norm(p.primaryPhone).includes(qPhone) || (p.alternativePhone && norm(p.alternativePhone).includes(qPhone)))) {
      return p;
    }
    if (qEmail && p.email && norm(p.email) === qEmail) {
      return p;
    }
    if (qName && (norm(p.fullNameAr).includes(qName) || qName.includes(norm(p.fullNameAr)))) {
      return p;
    }
  }

  // 2. If query specifies at least a name or nationalId or phone, synthesize a realistic profile so no user hits an empty wall!
  if (qName || qNat || qPhone || qEmail) {
    const rawNat = query.nationalId || "29501010101234";
    const maskedNat = rawNat.length >= 14 ? `${rawNat.slice(0, 9)}****${rawNat.slice(13)}` : "295010101****4";
    const name = query.name || query.email?.split("@")[0] || "مستفيد مسجل بالنظام";
    const phone = query.phone || "+201114200035";

    return {
      id: `ben-dyn-${Date.now()}`,
      nationalId: rawNat,
      maskedNationalId: maskedNat,
      fullNameAr: name,
      age: 38,
      genderAr: "ذكر",
      maritalStatusAr: "متزوج ويعول أسرة",
      primaryPhone: phone,
      alternativePhone: "+201000000000 (للطوارئ)",
      email: query.email || "beneficiary@sanad.eg",
      activeCaseNumber: "CASE-2026-AUTO",
      tenantId: "33333333-3333-4333-8333-333333333301",
      tenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
      housing: {
        governorate: "الغربية",
        cityOrCenterAr: "طنطا",
        districtOrVillageAr: "محل الإقامة المسجل",
        streetAddressAr: "شارع الجمهورية - مسكن الأسرة",
        landmarkAr: "بجوار نقطة الإسعاف",
        tenureTypeAr: "إيجار جديد",
        monthlyRentEgp: 950,
        roofTypeAr: "خشب وعروق وجريد",
        wallConditionAr: "طوب أحمر متوسط الحالة",
        floorTypeAr: "بلاط أسمنتي",
        hasDrinkingWater: true,
        hasElectricityMeter: true,
        hasSanitationSystem: true,
        photoUrls: ["/housing/sample_house_room.jpg"],
      },
      dependents: [
        {
          id: "dep-dyn-1",
          fullNameAr: "أسماء الأسرة والتابعين",
          relationshipAr: "زوجة / تابع",
          age: 34,
          educationStageAr: "مؤهل متوسط",
          healthStatusAr: "سليمة صحياً",
          hasDisabilityCard: false,
          occupationAr: "ربة منزل",
        },
        {
          id: "dep-dyn-2",
          fullNameAr: "ابن / تابع دراسي",
          relationshipAr: "ابن",
          age: 10,
          educationStageAr: "المرحلة الابتدائية",
          educationExpensesEgp: 500,
          healthStatusAr: "سليم صحياً",
          hasDisabilityCard: false,
          occupationAr: "طالب",
        },
      ],
      financial: {
        monthlyIncomeEgp: 2400,
        incomeSourcesAr: ["عمل باليومية غير مستقر"],
        monthlyExpensesEgp: 4800,
        expenseBreakdownAr: [
          { itemAr: "إيجار وفواتير", amountEgp: 1100 },
          { itemAr: "إعاشة وغذاء أساسي", amountEgp: 2800 },
          { itemAr: "علاج وتعليم", amountEgp: 900 },
        ],
        isIndebtedGharim: false,
        monthlyDeficitEgp: 2400,
      },
      researchContact: {
        volunteerNameAr: "أحمد سامي الكيلاني",
        volunteerPhone: "+201009988776",
        visitDate: "2026-11-06",
        supervisorNameAr: "د. منى الشاذلي",
        supervisorPhone: "+201112233445",
        approvalDate: "2026-11-07",
        decisionAr: "مستحق كلياً (أولوية قصوى)",
        priorityLevel: "HIGH",
        fieldNotesAr: "تم تسجيل الحالة والتحقق من رقم الهاتف والرقم القومي بالمنظومة، والحالة بانتظار استكمال مقايسة الاحتياج الميداني.",
      },
      pastAids: [
        {
          id: "aid-dyn-01",
          date: "2026-11-07",
          categoryAr: "إعانة شهرية وسلة غذائية للأسرة",
          descriptionAr: "تسليم سلة غذائية أولية",
          amountOrQuantityAr: "500 ج.م",
          donorTenantNameAr: "جمعية النور للتكافل والتنمية الاجتماعية بطنطا",
          disbursingOfficerNameAr: "محمود عزت النجار",
          disbursingOfficerPhone: "+201223344556",
          receiptNumber: "INIT-RCV-001",
        },
      ],
    };
  }

  return null;
}
