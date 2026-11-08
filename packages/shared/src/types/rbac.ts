export type RoleCode =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "RESEARCH_SUPERVISOR"
  | "VOLUNTEER"
  | "BENEFICIARY";

export type TenantType = "ASSOCIATION" | "INDIVIDUAL";

export const ROLE_PERMISSIONS_MATRIX: Record<RoleCode, string[]> = {
  SUPER_ADMIN: [
    "platform:tenants:approve",
    "platform:users:manage",
    "platform:reference_data:manage",
    "platform:audit:read",
    "platform:stats:read",
  ],
  TENANT_ADMIN: [
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
