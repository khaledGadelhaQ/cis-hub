import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService, 
    private readonly passwordService: PasswordService,
  ) {}

  // helper methods
  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private formatMemberSince(createdAt: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  private checkProfileCompletion(user: any): boolean {
    const requiredFields = [
      user.firstName,
      user.lastName,
      user.email,
    ];
    
    return requiredFields.every(field => field && field.trim().length > 0);
  }
  
  ////////// Manin methods //////////

  async login(email: string, password: string) {
    // first we check if the user exists and if the password is correct
    const user: Partial<User> | null = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isEmailVerified: true,
        mustChangePassword: true,
        role: true,
      },
    });

    if (
      !user ||
      !user.passwordHash ||
      !(await this.passwordService.verifyPassword(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your email before logging in.',
      );
    }

    if (user.mustChangePassword) {
      throw new UnauthorizedException(
        'You must change your password from the default password before logging in.',
      );
    }

    // Generate tokens
    const accessToken = await this.generateAccessToken(user as User);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token in database
    await this.prisma.userSession.create({
      data: {
        userId: user.id!,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
        updatedAt: new Date(),
      },
    });

    return {
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken, 
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          mustChangePassword: user.mustChangePassword,
        },
      },
    };
  }

  async changePassword(
    email: string,
    changePasswordDto: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    },
  ) {
    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new UnauthorizedException(
        'New password and confirmation do not match',
      );
    }

    const passwordStrenght = this.passwordService.validatePasswordStrength(
      changePasswordDto.newPassword,
    );
    if (!passwordStrenght.isValid) {
      const errors = passwordStrenght.errors;
      throw new UnauthorizedException(
        `New password is not strong enough: ${errors.join(', ')}`,
      );
    }

    const hashedNewPassword = await this.passwordService.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.prisma.user.update({
      where: { email },
      data: { passwordHash: hashedNewPassword, mustChangePassword: false },
    });

    return {
      status: 'success',
      message: 'Password changed successfully',
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // 1. Verify the refresh token signature
      const payload = this.jwtService.verify(refreshToken);

      // 2. Check if refresh token exists in database and is still valid
      const storedSession = await this.prisma.userSession.findFirst({
        where: {
          userId: payload.sub,
          refreshToken: refreshToken,
          expiresAt: {
            gt: new Date(), // Token not expired
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isEmailVerified: true,
              mustChangePassword: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (!storedSession || !storedSession.user) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // 3. Check if user is still active
      if (!storedSession.user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      // 4. Generate new tokens
      const newAccessToken = await this.generateAccessToken(
        storedSession.user as User,
      );
      const newRefreshToken = this.generateRefreshToken();

      // 5. Update the session with new refresh token (token rotation)
      await this.prisma.userSession.update({
        where: { id: storedSession.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          updatedAt: new Date(),
        },
      });

      return {
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken, // Return new refresh token
          user: {
            id: storedSession.user.id,
            email: storedSession.user.email,
            role: storedSession.user.role,
          },
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      // Invalidate the refresh token
      await this.prisma.userSession.updateMany({
        where: { refreshToken },
        data: { isActive: false },
      });

      return {
        status: 'success',
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Logout from all devices
  async logoutAll(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return {
      status: 'success',
      message: 'Logged out from all devices successfully',
    };
  }

  async getMe(user: Partial<User>) {
    // Validate input
    if (!user?.id) {
      throw new UnauthorizedException('Invalid user context');
    }

    try {
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          collegeId: true,
          phone: true,
          profileImageUrl: true,
          role: true,
          currentYear: true,
          departmentId: true,
          isActive: true,
          isEmailVerified: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
          // Include related data
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              sessions: {
                where: {
                  isActive: true,
                  expiresAt: {
                    gt: new Date(),
                  },
                },
              },
            },
          },
        },
      });

      // Check if user exists
      if (!fullUser) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user account is active
      if (!fullUser.isActive) {
        throw new UnauthorizedException('User account has been deactivated');
      }

      return {
        status: 'success',
        message: 'User details fetched successfully',
        data: {
          id: fullUser.id,
          email: fullUser.email,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          fullName: `${fullUser.firstName} ${fullUser.lastName}`,
          collegeId: fullUser.collegeId,
          phone: fullUser.phone,
          profileImageUrl: fullUser.profileImageUrl,
          role: fullUser.role,
          currentYear: fullUser.currentYear,
          department: fullUser.department,
          isActive: fullUser.isActive,
          isEmailVerified: fullUser.isEmailVerified,
          mustChangePassword: fullUser.mustChangePassword,
          createdAt: fullUser.createdAt,
          updatedAt: fullUser.updatedAt,
          activeSessions: fullUser._count.sessions,
          // Add computed fields
          memberSince: this.formatMemberSince(fullUser.createdAt),
          hasCompletedProfile: this.checkProfileCompletion(fullUser),
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Log the error for debugging
      console.error('Error fetching user details:', error);
      throw new UnauthorizedException('Failed to fetch user details');
    }
  }

  // Helper methods


}
