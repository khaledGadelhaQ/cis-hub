import { 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Put, 
  Req, 
  Body,
  Query,
  UploadedFile, 
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user_role.enum';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { UpdateUserDto } from './dto/upateUser.dto';
import { CreateUserDto } from './dto/createUser.dto';

@Controller('users')
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
  ){}
  // Regular user profile update
  @Put('/me')
  @HttpCode(HttpStatus.OK) // 200
  async updateMyProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
  // Upload avatar
  @Post('/upload-avatar')
  @HttpCode(HttpStatus.OK) // 200
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    console.log('Uploading avatar for user:', req.user.id);
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  // Get all users with pagination, search, and filtering (admin only)
  // This endpoint handles both listing all users and searching
  // Examples: 
  // GET /users?search=john - search for users
  // GET /users?role=STUDENT - filter by role
  // GET /users?isActive=true - filter by active status  // GET /users?skip=0&take=20 - pagination
  @Get()
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN)
  async getAllUsers(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: boolean,
    @Query('sortBy') sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.usersService.getAllUsers({ 
      skip, 
      take, 
      search, 
      role, 
      isActive, 
      sortBy, 
      sortOrder 
    });
  }
  // Get user by ID
  @Get('/:id')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.TA)
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
  // Admin: Update any user
  @Put('/:id')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN)
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }
  // Admin: Create new user
  @Post('/create')
  @HttpCode(HttpStatus.CREATED) // 201
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }  
  // Admin: Delete user (soft delete)
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    // Return nothing for 204 No Content
  }
  // Admin: Deactivate user
  @Put('/:id/deactivate')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN)
  async deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
  // Admin: Activate user
  @Put('/:id/activate')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN)
  async activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
  // Admin: Reset user password to collegeId
  @Post('/:id/reset-password')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN)
  async resetUserPassword(@Param('id') id: string) {
    await this.usersService.resetUserPassword(id);
    return {
      status: 'success',
      message: 'User password has been reset to their college ID. User must change password on next login.',
    };
  }

  // Student department transition (GE -> CS/IT/IS for year 3)
  @Put('/:id/transition-department')
  @HttpCode(HttpStatus.OK) // 200
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR) // Allow admins and professors to handle transitions
  async transitionStudentDepartment(
    @Param('id') id: string, 
    @Body() body: { newDepartmentId: string }
  ) {
    return this.usersService.transitionStudentDepartment(id, body.newDepartmentId);
  }

}
