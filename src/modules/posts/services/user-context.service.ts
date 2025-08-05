import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserRole } from '../../../common/enums/user_role.enum';
import { UserVisibilityContext } from '../types/posts.types';

@Injectable()
export class UserContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserVisibilityContext(userId: string): Promise<UserVisibilityContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        departmentId: true,
        currentYear: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId,
      currentYear: user.currentYear,
      canSeeAllDepartments: user.role === UserRole.ADMIN,
      canCreateForAnyDepartment: [UserRole.PROFESSOR, UserRole.ADMIN].includes(user.role as UserRole),
    };
  }

  async validateUserCanAccessDepartment(userId: string, departmentId: string): Promise<boolean> {
    const context = await this.getUserVisibilityContext(userId);
    
    // Admins can access any department
    if (context.canSeeAllDepartments) {
      return true;
    }

    // Users can only access their own department (strict isolation)
    return context.departmentId === departmentId;
  }

  async validateUserCanAccessYear(userId: string, targetYear: number): Promise<boolean> {
    const context = await this.getUserVisibilityContext(userId);
    
    // Admins can access any year
    if (context.canSeeAllDepartments) {
      return true;
    }

    // Users can only access their own year
    return context.currentYear === targetYear;
  }
}
