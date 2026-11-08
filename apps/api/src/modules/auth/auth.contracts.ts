/**
 * SANAD Authoritative Authentication & Identity Contracts (NestJS Backend - Sprint 1)
 * IMPORTANT: Format validation in the browser is NEVER proof of identity or uniqueness.
 * Public endpoints return generic responses to prevent National ID / Phone enumeration.
 */

export interface RegisterAccountRequestDto {
  nationalId: string;        // 14 digits, validated & HMAC-hashed server-side
  fullNameAr: string;
  primaryMobile: string;     // Normalized to E.164 (+201XXXXXXXXX)
  password: string;
  accountContext: 'ASSOCIATION_OWNER' | 'INDIVIDUAL_OPERATOR' | 'BENEFICIARY_SELF_SERVICE';
  tenantRegistration?: {
    nameAr: string;
    registrationNumber?: string;
    governorate: string;
  };
}

export interface PublicAuthAcceptedResponseDto {
  /**
   * Generic response returned whether or not a National ID or Phone conflict exists.
   * Prevents account enumeration on public endpoints.
   */
  status: 'VERIFICATION_STEP_INITIATED';
  verificationCorrelationId: string;
  messageAr: string;
  expiresInSeconds: number;
}

export interface VerifyPhoneOtpRequestDto {
  verificationCorrelationId: string;
  otpCode: string; // 6-digit one-time code
}

export interface IAuthoritativeIdentityUniquenessContract {
  /**
   * Checks whether `HMAC_SHA256(pepper, nationalId)` already exists in `person_identities`.
   * Executed strictly inside a Serializable/RepeatableRead database transaction.
   * Never exposed directly as a boolean oracle to unauthenticated clients.
   */
  checkNationalIdConflictInternal(nationalId: string): Promise<{
    existsAsVerifiedUser: boolean;
    existsAsBeneficiaryProfileOnly: boolean;
    personIdentityId?: string;
  }>;

  /**
   * Enforces that a verified primary login/recovery phone (`is_primary_login = true AND is_verified = true`)
   * belongs to at most one active account, while allowing shared household contact numbers (`is_shared_contact = true`).
   */
  verifyAndAssignPrimaryPhoneTransactional(params: {
    userId: string;
    phoneE164: string;
    otpCode: string;
    correlationId: string;
  }): Promise<{ status: 'VERIFIED' | 'CONFLICT_RECOVERY_REQUIRED' | 'INVALID_OTP' }>;
}
