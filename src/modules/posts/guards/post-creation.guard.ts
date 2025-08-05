import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../common/enums/user_role.enum';

@Injectable()
export class PostCreationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Only TAs, Professors and Admins can create posts
    const allowedRoles: UserRole[] = [UserRole.TA, UserRole.PROFESSOR, UserRole.ADMIN];
    
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Only TAs, Professors, and Admins can create posts');
    }

    return true;
  }
}
