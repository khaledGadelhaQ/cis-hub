import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './dto';
import { PostCreationGuard } from './guards/post-creation.guard';
import { PostAuthorGuard } from './guards/post-author.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user_role.enum';
import { PostScope } from '../../common/enums/post_scope.enum';
import { PostType } from '../../common/enums/post_type.enum';
import { Priority } from '../../common/enums/priority.enum';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(PostCreationGuard)
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req, @Query() filters: PostFilterDto) {
    return this.postsService.findAll(filters, req.user.id);
  }

  @Get('pinned')
  async findPinned(@Request() req) {
    const pinnedFilters = new PostFilterDto();
    pinnedFilters.isPinned = true;
    pinnedFilters.sortBy = 'createdAt';
    pinnedFilters.sortOrder = 'desc';
    pinnedFilters.limit = 50; // More pinned posts per page
    
    return this.postsService.findAll(pinnedFilters, req.user.id);
  }

  @Get('search')
  async search(@Request() req, @Query() filters: PostFilterDto) {
    if (!filters.search) {
      return {
        data: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 0,
      };
    }
    
    return this.postsService.findAll(filters, req.user.id);
  }

  @Get('feed/my-department')
  async getMyDepartmentFeed(@Request() req, @Query() filters: PostFilterDto) {
    const departmentFilters = new PostFilterDto();
    Object.assign(departmentFilters, filters);
    departmentFilters.scope = PostScope.DEPARTMENT;
    
    return this.postsService.findAll(departmentFilters, req.user.id);
  }

  @Get('feed/my-year')
  async getMyYearFeed(@Request() req, @Query() filters: PostFilterDto) {
    const yearFilters = new PostFilterDto();
    Object.assign(yearFilters, filters);
    yearFilters.scope = PostScope.YEAR;
    
    return this.postsService.findAll(yearFilters, req.user.id);
  }

  @Get('feed/announcements')
  async getAnnouncementsFeed(@Request() req, @Query() filters: PostFilterDto) {
    const announcementFilters = new PostFilterDto();
    Object.assign(announcementFilters, filters);
    announcementFilters.postType = PostType.ANNOUNCEMENT;
    announcementFilters.sortBy = 'publishedAt';
    announcementFilters.sortOrder = 'desc';
    
    return this.postsService.findAll(announcementFilters, req.user.id);
  }

  @Get('feed/assignments')
  async getAssignmentsFeed(@Request() req, @Query() filters: PostFilterDto) {
    const assignmentFilters = new PostFilterDto();
    Object.assign(assignmentFilters, filters);
    assignmentFilters.postType = PostType.EVENT; // Using EVENT for assignment-like posts
    assignmentFilters.sortBy = 'publishedAt';
    assignmentFilters.sortOrder = 'desc';
    
    return this.postsService.findAll(assignmentFilters, req.user.id);
  }

  @Get('feed/global')
  async getGlobalFeed(@Request() req, @Query() filters: PostFilterDto) {
    const globalFilters = new PostFilterDto();
    Object.assign(globalFilters, filters);
    globalFilters.scope = PostScope.GLOBAL;
    globalFilters.sortBy = 'publishedAt';
    globalFilters.sortOrder = 'desc';
    
    return this.postsService.findAll(globalFilters, req.user.id);
  }

  @Get('feed/urgent')
  async getUrgentFeed(@Request() req, @Query() filters: PostFilterDto) {
    const urgentFilters = new PostFilterDto();
    Object.assign(urgentFilters, filters);
    urgentFilters.priority = Priority.HIGH;
    urgentFilters.sortBy = 'publishedAt';
    urgentFilters.sortOrder = 'desc';
    
    return this.postsService.findAll(urgentFilters, req.user.id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.postsService.findById(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(PostAuthorGuard)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(PostAuthorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param('id') id: string) {
    await this.postsService.delete(id, req.user.id);
  }

  @Post(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async togglePin(@Request() req, @Param('id') id: string) {
    return this.postsService.togglePin(id, req.user.id);
  }

  @Get(':id/attachments')
  async getAttachments(@Request() req, @Param('id') id: string) {
    const post = await this.postsService.findById(id, req.user.id);
    return {
      postId: id,
      attachments: post.attachments,
    };
  }
}
