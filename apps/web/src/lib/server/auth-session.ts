import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type AuthRoleCode =
  | "SUPER_ADMIN"
  | "ASSOCIATION_ADMIN"
  | "INDIVIDUAL_INITIATIVE"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY";

export interface SanadSessionPayload {
  userId: string;
  email: string;
  fullNameAr: string;
  maskedNationalId: string;
  phoneE164: string;
  governorateNameAr: string;
  role: AuthRoleCode;
  permissions: string[];
  tenantId: string | null;
  tenantNameAr: string | null;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "sanad_session";

export const ROLE_PERMISSIONS_MAP: Record<AuthRoleCode, string[]> = {
  SUPER_ADMIN: [
    "platform:tenants:approve",
    "platform:users:manage",
    "platform:reference_data:manage",
    "platform:audit:read",
    "platform:stats:read",
    "tenant:members:manage",
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  ASSOCIATION_ADMIN: [
    "tenant:members:manage",
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  INDIVIDUAL_INITIATIVE: [
    "tenant:beneficiaries:manage",
    "tenant:households:manage",
    "tenant:cases:manage",
    "tenant:cases:decide_eligibility",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:donors:manage",
    "tenant:donations:manage",
    "tenant:allocations:create",
    "tenant:deliveries:manage",
    "tenant:reports:read",
  ],
  RESEARCH_SUPERVISOR: [
    "tenant:cases:read_assigned",
    "tenant:research:assign",
    "tenant:research:review",
    "tenant:cases:recommend_eligibility",
  ],
  VOLUNTEER: [
    "tenant:tasks:read_assigned",
    "tenant:research:submit_report",
    "tenant:attachments:upload_authorized",
    "tenant:deliveries:confirm_assigned",
  ],
  BENEFICIARY: [
    "portal:profile:manage_own",
    "portal:requests:create_own",
    "portal:requests:read_own",
    "portal:documents:upload_own",
    "portal:aid_history:read_own_verified",
    "portal:corrections:submit_own",
  ],
};

export const ROLE_LABELS_AR: Record<AuthRoleCode, string> = {
  SUPER_ADMIN: "مدير المنصة المركزي",
  ASSOCIATION_ADMIN: "مدير جمعية خيرية",
  INDIVIDUAL_INITIATIVE: "مبادر فردي مستقل",
  RESEARCH_SUPERVISOR: "مشرف البحث الاجتماعي",
  VOLUNTEER: "باحث / متطوع ميداني",
  BENEFICIARY: "مستفيد",
};

function getSessionSecret(): string {
  return (
    process.env.JWT_ACCESS_SECRET ||
    process.env.NATIONAL_ID_HMAC_PEPPER ||
    "sanad-production-hmac-session-secret-2026"
  );
}

export function hashPasswordScrypt(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordScrypt(password: string, storedHash: string): boolean {
  if (!storedHash.startsWith("scrypt$")) {
    return false;
  }
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, originalHex] = parts;
  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, "hex");
  if (derived.length !== original.length) return false;
  return timingSafeEqual(derived, original);
}

export function signSessionToken(payload: SanadSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token?: string | null): SanadSessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expectedSig = createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SanadSessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getServerSession(): SanadSessionPayload | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(raw);
  } catch {
    return null;
  }
}

export function hasPermission(
  session: SanadSessionPayload | null,
  requiredPermission: string
): boolean {
  if (!session) return false;
  if (session.role === "SUPER_ADMIN") return true;
  return session.permissions.includes(requiredPermission);
}
