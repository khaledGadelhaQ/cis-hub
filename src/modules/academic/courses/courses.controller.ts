import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { 
  CreateCourseClassDto, 
  CreateCourseSectionDto, 
  CreateCourseEnrollmentDto,
  AssignClassProfessorDto,
  UpdateCourseClassDto,
  UpdateCourseSectionDto
} from './dto/course-management.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user_role.enum';

@Controller('academic/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ================================
  // COURSE ENDPOINTS
  // ================================

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll(
    @Query('department') departmentId?: string,
    @Query('year') year?: string,
    @Query('search') search?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.coursesService.findAll(departmentId, yearNum, search);
  }

  // ================================
  // COURSE CLASS ENDPOINTS
  // ================================

  @Post('classes')
  @Roles(UserRole.ADMIN)
  createClass(@Body() createCourseClassDto: CreateCourseClassDto) {
    return this.coursesService.createClass(createCourseClassDto);
  }

  @Get('classes')
  findAllClasses(
    @Query('courseId') courseId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.coursesService.findAllClasses(courseId, skipNum, takeNum);
  }

  @Get('classes/:id')
  findOneClass(@Param('id') id: string) {
    return this.coursesService.findOneClass(id);
  }

  @Patch('classes/:id')
  @Roles(UserRole.ADMIN)
  updateClass(@Param('id') id: string, @Body() updateCourseClassDto: UpdateCourseClassDto) {
    return this.coursesService.updateClass(id, updateCourseClassDto);
  }

  @Delete('classes/:id')
  @Roles(UserRole.ADMIN)
  removeClass(@Param('id') id: string) {
    return this.coursesService.removeClass(id);
  }

  // ================================
  // COURSE SECTION ENDPOINTS
  // ================================

  @Post('sections')
  @Roles(UserRole.ADMIN)
  createSection(@Body() createCourseSectionDto: CreateCourseSectionDto) {
    return this.coursesService.createSection(createCourseSectionDto);
  }

  @Get('sections')
  findAllSections(
    @Query('courseId') courseId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.coursesService.findAllSections(courseId, skipNum, takeNum);
  }

  @Get('sections/:id')
  findOneSection(@Param('id') id: string) {
    return this.coursesService.findOneSection(id);
  }

  @Patch('sections/:id')
  @Roles(UserRole.ADMIN)
  updateSection(@Param('id') id: string, @Body() updateCourseSectionDto: UpdateCourseSectionDto) {
    return this.coursesService.updateSection(id, updateCourseSectionDto);
  }

  @Delete('sections/:id')
  @Roles(UserRole.ADMIN)
  removeSection(@Param('id') id: string) {
    return this.coursesService.removeSection(id);
  }



  // ================================
  // CLASS PROFESSOR ENDPOINTS
  // ================================

  @Post('classes/professors')
  @Roles(UserRole.ADMIN)
  assignProfessorToClass(@Body() assignClassProfessorDto: AssignClassProfessorDto) {
    return this.coursesService.assignProfessorToClass(assignClassProfessorDto);
  }

  @Delete('classes/:classId/professors/:professorId')
  @Roles(UserRole.ADMIN)
  removeProfessorFromClass(
    @Param('classId') classId: string,
    @Param('professorId') professorId: string,
  ) {
    return this.coursesService.removeProfessorFromClass(classId, professorId);
  }

  @Get('classes/:classId/professors')
  findClassProfessors(@Param('classId') classId: string) {
    return this.coursesService.findClassProfessors(classId);
  }

  // ================================
  // COURSE ENROLLMENT ENDPOINTS
  // ================================

  @Post('enrollments')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  createEnrollment(@Body() createCourseEnrollmentDto: CreateCourseEnrollmentDto) {
    return this.coursesService.createEnrollment(createCourseEnrollmentDto);
  }

  @Get('enrollments')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR, UserRole.TA)
  findEnrollments(
    @Query('courseId') courseId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 20;
    return this.coursesService.findEnrollments(courseId, classId, sectionId, skipNum, takeNum);
  }

  @Delete('enrollments/:id')
  @Roles(UserRole.ADMIN, UserRole.PROFESSOR)
  removeEnrollment(@Param('id') id: string) {
    return this.coursesService.removeEnrollment(id);
  }

  // ================================
  // SPECIFIC COURSE ENDPOINTS (Must come after specific routes)
  // ================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
