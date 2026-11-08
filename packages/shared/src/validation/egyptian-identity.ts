export const EGYPTIAN_GOVERNORATE_CODES: Record<string, string> = {
  "01": "القاهرة",
  "02": "الإسكندرية",
  "03": "بورسعيد",
  "04": "السويس",
  "11": "دمياط",
  "12": "الدقهلية",
  "13": "الشرقية",
  "14": "القليوبية",
  "15": "كفر الشيخ",
  "16": "الغربية",
  "17": "المنوفية",
  "18": "البحيرة",
  "19": "الإسماعيلية",
  "21": "الجيزة",
  "22": "بني سويف",
  "23": "الفيوم",
  "24": "المنيا",
  "25": "أسيوط",
  "26": "سوهاج",
  "27": "قنا",
  "28": "أسوان",
  "29": "الأقصر",
  "31": "البحر الأحمر",
  "32": "الوادي الجديد",
  "33": "مطروح",
  "34": "شمال سيناء",
  "35": "جنوب سيناء",
  "88": "خارج الجمهورية",
};

export interface NationalIdValidationResult {
  isValid: boolean;
  errorAr?: string;
  parsed?: {
    century: number;
    birthDateIso: string;
    governorateCode: string;
    governorateNameAr: string;
  };
}

/**
 * Validates Egyptian National ID format rules (14 digits, century 2/3, valid calendar date, valid governorate code).
 * NOTE: Format validation is NOT proof of identity or database uniqueness.
 */
export function validateEgyptianNationalId(rawInput: string): NationalIdValidationResult {
  const cleaned = rawInput.trim();
  if (!/^\d{14}$/.test(cleaned)) {
    return {
      isValid: false,
      errorAr: "الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً بالضبط.",
    };
  }

  const centuryDigit = cleaned[0];
  if (centuryDigit !== "2" && centuryDigit !== "3") {
    return {
      isValid: false,
      errorAr: "كود القرن غير صالح؛ يجب أن يبدأ الرقم القومي بـ 2 أو 3.",
    };
  }

  const yearBase = centuryDigit === "2" ? 1900 : 2000;
  const yy = parseInt(cleaned.slice(1, 3), 10);
  const mm = parseInt(cleaned.slice(3, 5), 10);
  const dd = parseInt(cleaned.slice(5, 7), 10);
  const fullYear = yearBase + yy;

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return {
      isValid: false,
      errorAr: "تاريخ الميلاد المضمن في الرقم القومي غير صالح.",
    };
  }

  const candidateDate = new Date(Date.UTC(fullYear, mm - 1, dd));
  if (
    candidateDate.getUTCFullYear() !== fullYear ||
    candidateDate.getUTCMonth() !== mm - 1 ||
    candidateDate.getUTCDate() !== dd
  ) {
    return {
      isValid: false,
      errorAr: "تاريخ الميلاد المضمن في الرقم القومي غير مطابق للتقويم.",
    };
  }

  const now = new Date();
  if (candidateDate > now) {
    return {
      isValid: false,
      errorAr: "تاريخ الميلاد في الرقم القومي لا يمكن أن يكون في المستقبل.",
    };
  }

  const govCode = cleaned.slice(7, 9);
  const govNameAr = EGYPTIAN_GOVERNORATE_CODES[govCode];
  if (!govNameAr) {
    return {
      isValid: false,
      errorAr: "كود المحافظة المضمن في الرقم القومي غير معتمد.",
    };
  }

  const birthDateIso = `${fullYear}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return {
    isValid: true,
    parsed: {
      century: centuryDigit === "2" ? 20 : 21,
      birthDateIso,
      governorateCode: govCode,
      governorateNameAr: govNameAr,
    },
  };
}

export interface EgyptianPhoneValidationResult {
  isValid: boolean;
  e164?: string;
  carrierPrefix?: "010" | "011" | "012" | "015";
  errorAr?: string;
}

/**
 * Validates and normalizes Egyptian mobile phone numbers into E.164 (+201XXXXXXXXX).
 */
export function normalizeAndValidateEgyptianMobile(rawInput: string): EgyptianPhoneValidationResult {
  const stripped = rawInput.replace(/[\s\-()]/g, "");
  let nationalFormat = stripped;

  if (nationalFormat.startsWith("+20")) {
    nationalFormat = "0" + nationalFormat.slice(3);
  } else if (nationalFormat.startsWith("0020")) {
    nationalFormat = "0" + nationalFormat.slice(4);
  } else if (nationalFormat.startsWith("20") && nationalFormat.length === 12) {
    nationalFormat = "0" + nationalFormat.slice(2);
  }

  if (!/^01[0125]\d{8}$/.test(nationalFormat)) {
    return {
      isValid: false,
      errorAr: "رقم الهاتف المحمول المصري غير صالح؛ يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً.",
    };
  }

  const prefix = nationalFormat.slice(0, 3) as "010" | "011" | "012" | "015";
  return {
    isValid: true,
    e164: `+2${nationalFormat}`,
    carrierPrefix: prefix,
  };
}
