import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

/**
 * Enforces strict server-side multi-tenant isolation.
 * Never trusts `tenant_id` from client payload without verifying active `TenantMembership` and permission.
 * Super Admin does NOT automatically bypass sensitive beneficiary privacy restrictions.
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestedTenantId = request.headers["x-tenant-id"] || request.params?.tenantId;

    if (!user) {
      throw new ForbiddenException("غير مصرح بالوصول بدون جلسة موثقة.");
    }

    if (!requestedTenantId) {
      return true;
    }

    const membership = user.memberships?.find(
      (m: { tenantId: string; isActive: boolean }) => m.tenantId === requestedTenantId && m.isActive,
    );

    if (!membership) {
      throw new ForbiddenException("عزل المستأجرين: لا تملك عضوية نشطة في هذه الجهة الخيرية.");
    }

    request.activeTenantMembership = membership;
    return true;
  }
}
