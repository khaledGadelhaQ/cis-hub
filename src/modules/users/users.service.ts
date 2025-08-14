import { Injectable, NotFoundException, BadRequestException, UseInterceptors } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/upateUser.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { PasswordService } from '../auth/services/password.service';
import { FilesService } from '../files/services/files.service';
import { UploadContext } from '../../common/enums/upload_context.enum';
import { Cache, CacheInvalidate } from '../../common/decorators/cache.decorator';
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';
import { CacheTTL } from '../../config/cache.config';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private filesService: FilesService,
  ) {}

  // Find user by email
  @Cache({
    key: 'user:email:{email}',
    ttl: CacheTTL.USER_PROFILE,
    condition: (result) => result != null, // Only cache if user exists
  })
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find user by ID
  @Cache({
    key: 'user:profile:{id}',
    ttl: CacheTTL.USER_PROFILE,
    condition: (result) => result != null, // Only cache if user exists
  })
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  // Admin-only: Update any user
  @CacheInvalidate({
    keys: [
      'user:profile:{{userId}}',
      'user:email:{{existingUser.email}}', // Invalidate old email cache
      'users:all:*' // Invalidate all user list caches
    ],
    condition: (result) => result && result.id
  })
  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new BadRequestException('Email is already in use');
      }
    }

    // Prepare update data
    const updateData: any = { ...updateUserDto };

    // Handle password change if provided
    if (updateUserDto.newPassword) {
      const passwordValidation = this.passwordService.validatePasswordStrength(updateUserDto.newPassword);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(`Password is not strong enough: ${passwordValidation.errors.join(', ')}`);
      }
      
      updateData.passwordHash = await this.passwordService.hashPassword(updateUserDto.newPassword);
      updateData.mustChangePassword = false; // Admin set new password, so user doesn't need to change it
      delete updateData.newPassword; // Remove from update data
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  // Regular user profile update (limited fields)
  @CacheInvalidate({
    keys: ['user:profile:{{userId}}'],
    condition: (result) => result && result.id
  })
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  // Upload avatar
  @Cache({
    key: 'user:profile:{{userId}}',
    ttl: 3600, // 1 hour
    condition: (result) => result && result.id
  })
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    // Use the centralized files service to upload the avatar
    const uploadedFile = await this.filesService.uploadFile(
      file,
      { 
        context: UploadContext.PROFILE,
        isPublic: true, // Profile pics are usually public
      },
      userId
    );

    // Update user profile with the file path
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: uploadedFile.filePath },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedUser;
  }

  // Get all users with pagination (admin only)
  @Cache({
    key: 'users:all:{{params}}',
    ttl: 300, // 5 minutes - shorter TTL for dynamic lists
    condition: (result) => result && result.data && result.data.length > 0
  })
  async getAllUsers(params: {
    skip?: number;
    take?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      skip = 0, 
      take = 20, 
      search, 
      role, 
      isActive, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = params;

    const where: any = {};

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { collegeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add active status filter
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          collegeId: true,
          role: true,
          currentYear: true,
          isActive: true,
          isEmailVerified: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
    ]);

    return {
      pagination: {
        total,
        page: Math.floor(skip / take) + 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
      data: users,
    };
  }

  // Admin: Deactivate user
  @CacheInvalidate({
    keys: [
      'user:profile:{{userId}}',
      'users:all:*' // Invalidate user lists since active status changed
    ],
    condition: (result) => result && result.id
  })
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Deactivate user and invalidate all sessions
    const [updatedUser] = await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      // Invalidate all user sessions
      this.prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);

    return updatedUser;
  }

  // Admin: Activate user
  @CacheInvalidate({
    keys: [
      'user:profile:{{userId}}',
      'users:all:*' // Invalidate user lists since active status changed
    ],
    condition: (result) => result && result.id
  })
  async activateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }
  // Admin: Reset user password (uses collegeId as default password)
  async resetUserPassword(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.collegeId) {
      throw new BadRequestException('User must have a college ID to reset password');
    }

    // Use collegeId as the default password
    const hashedPassword = await this.passwordService.hashPassword(user.collegeId);

    await Promise.all([
      // Update password
      this.prisma.user.update({
        where: { id: userId },
        data: { 
          passwordHash: hashedPassword,
          mustChangePassword: true, // User must change password on next login
        },
      }),
      // Invalidate all user sessions
      this.prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);
  }
  // Admin: Create new user
  @CacheInvalidate({
    keys: ['users:all:*'], // Invalidate all user list caches when new user is created
    condition: (result) => result && result.id
  })
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Use collegeId as default password (hashed)
    const hashedPassword = await this.passwordService.hashPassword(createUserDto.collegeId);

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        collegeId: createUserDto.collegeId,
        phone: createUserDto.phone,
        profileImageUrl: createUserDto.profileImageUrl,
        role: createUserDto.role,
        currentYear: createUserDto.currentYear,
        departmentId: createUserDto.departmentId,
        isActive: createUserDto.isActive ?? true,
        isEmailVerified: createUserDto.isEmailVerified ?? false,
        mustChangePassword: createUserDto.mustChangePassword ?? true,
        passwordHash: hashedPassword,
      },
    });
  }
  // Admin: Delete user (soft delete by deactivating)
  @CacheInvalidate({
    keys: [
      'user:profile:{{userId}}',
      'users:all:*' // Invalidate user lists since user is being deleted
    ],
    condition: (result) => result && result.id
  })
  async deleteUser(userId: string): Promise<User> {
    //TODO: set background job to delete user data after 30 days
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating user and invalidating sessions
    const [updatedUser] = await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      // Invalidate all user sessions
      this.prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
    ]);

    return updatedUser;
  }

  // Handle student department transition (GE -> CS/IT/IS for year 3)
  async transitionStudentDepartment(userId: string, newDepartmentId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can transition departments');
    }

    // Verify new department exists and is valid
    const newDepartment = await this.prisma.department.findUnique({
      where: { id: newDepartmentId },
    });

    if (!newDepartment) {
      throw new BadRequestException('Department not found');
    }

    // College system rules: Students can only transition from GE to specialized departments at year 3
    if (user.currentYear === 3 && user.department?.code === 'GE') {
      if (!['CS', 'IT', 'IS'].includes(newDepartment.code)) {
        throw new BadRequestException('Year 3 students can only transition to CS, IT, or IS departments');
      }
    } else if (user.currentYear && user.currentYear < 3) {
      throw new BadRequestException('Students can only transition departments at year 3');
    } else if (user.department?.code !== 'GE') {
      throw new BadRequestException('Students can only transition once from General Education to a specialized department');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { departmentId: newDepartmentId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }
}
