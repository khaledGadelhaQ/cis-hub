import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { AssignTaDto } from './dto/assign-ta.dto';
import { AssignSectionDto } from './dto/assign-section.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user_role.enum';

@Controller('academic/enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('my-courses')
  getMyCourses(@Request() req) {
    return this.enrollmentsService.getMyCourses(req.user.id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  enrollStudent(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.enrollmentsService.enrollStudent(enrollStudentDto);
  }

  @Post('assign-ta')
  @Roles(UserRole.ADMIN)
  assignTa(@Body() assignTaDto: AssignTaDto) {
    return this.enrollmentsService.assignTa(assignTaDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id/assign-section')
  @Roles(UserRole.ADMIN)
  assignSection(@Param('id') id: string, @Body() assignSectionDto: AssignSectionDto) {
    return this.enrollmentsService.assignSection(id, assignSectionDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  removeEnrollment(@Param('id') id: string) {
    return this.enrollmentsService.removeEnrollment(id);
  }
}
