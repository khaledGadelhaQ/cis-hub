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
