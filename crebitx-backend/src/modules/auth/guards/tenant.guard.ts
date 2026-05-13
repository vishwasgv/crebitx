import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    // The tenant_id should be extracted from the JWT token by the JwtStrategy
    // and attached to the request.user object
    return !!request.user?.tenant_id;
  }
}
