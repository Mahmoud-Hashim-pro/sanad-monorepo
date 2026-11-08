import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  type AuthRoleCode,
  ROLE_PERMISSIONS_MAP,
  ROLE_LABELS_AR,
  PERMISSION_DESCRIPTIONS_AR,
  ROLE_GUIDE_ITEMS_AR,
} from "../domain/sanad-rules";

export {
  type AuthRoleCode,
  ROLE_PERMISSIONS_MAP,
  ROLE_LABELS_AR,
  PERMISSION_DESCRIPTIONS_AR,
  ROLE_GUIDE_ITEMS_AR,
};

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
