import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreatePostDto, UpdatePostDto, PostFilterDto } from './dto';
import { PaginatedResponse, UserVisibilityContext, PostWithRelations } from './types/posts.types';
import { UserRole } from '../../common/enums/user_role.enum';
import { PostScope } from '../../common/enums/post_scope.enum';
import { Priority } from '../../common/enums/priority.enum';
import { Prisma, Post } from '@prisma/client';
import { UserContextService } from './services/user-context.service';
import { PostVisibilityService } from './services/post-visibility.service';
import { PostSearchService } from './services/post-search.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userContextService: UserContextService,
    private readonly postVisibilityService: PostVisibilityService,
    private readonly postSearchService: PostSearchService,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    // Validate user and department access
    const userContext = await this.userContextService.getUserVisibilityContext(authorId);
    
    // Check if user can post to this department
    if (createPostDto.departmentId && 
        !await this.userContextService.validateUserCanAccessDepartment(authorId, createPostDto.departmentId)) {
      throw new ForbiddenException('You do not have permission to post in this department');
    }

    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        postType: createPostDto.postType,
        scope: createPostDto.scope,
        departmentId: createPostDto.departmentId,
        authorId,
        targetYear: createPostDto.targetYear,
        priority: createPostDto.priority || Priority.MEDIUM,
        isPinned: false,
        publishedAt: createPostDto.publishedAt ? new Date(createPostDto.publishedAt) : new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });

    // Emit event for notification system
    this.eventEmitter.emit('post.created', {
      postId: post.id,
      authorId: post.authorId,
      departmentId: post.departmentId,
      postType: post.postType,
      scope: post.scope,
      targetYear: post.targetYear,
    });

    return post;
  }

  async findAll(filters: PostFilterDto, userId: string): Promise<PaginatedResponse<PostWithRelations>> {
    const userContext = await this.userContextService.getUserVisibilityContext(userId);
    
    // If there's a search query, use the search service
    if (filters.search && filters.search.trim().length > 0) {
      return this.postSearchService.searchPosts(filters.search, userContext, filters);
    }
    
    const visibilityFilter = await this.postVisibilityService.buildVisibilityFilter(userContext);
    const userFilters = this.postVisibilityService.buildUserFilters(filters);
    
    const query: Prisma.PostFindManyArgs = {
      where: {
        AND: [visibilityFilter, userFilters],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
      orderBy: this.buildOrderBy(filters),
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany(query) as Promise<PostWithRelations[]>,
      this.prisma.post.count({ where: query.where }),
    ]);

    return {
      data: posts,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async findById(id: string, userId: string): Promise<PostWithRelations> {
    const userContext = await this.userContextService.getUserVisibilityContext(userId);
    const visibilityFilter = await this.postVisibilityService.buildVisibilityFilter(userContext);
    
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        AND: [visibilityFilter],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found or you do not have permission to view it');
    }

    return post;
  }

  async update(id: string, dto: UpdatePostDto, userId: string): Promise<PostWithRelations> {
    // Check if post exists and user has permission
    await this.validateUserCanEditPost(userId, id);

    // Validate business rules for updates
    if (dto.scope || dto.departmentId || dto.targetYear) {
      await this.validateCreatePostDto(dto as CreatePostDto, userId);
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.postType && { postType: dto.postType }),
        ...(dto.scope && { scope: dto.scope }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.targetYear !== undefined && { targetYear: dto.targetYear }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.publishedAt !== undefined && { publishedAt: dto.publishedAt }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });

    // Handle attachment updates if provided
    if (dto.attachmentIds !== undefined) {
      await this.updatePostAttachments(id, dto.attachmentIds, userId);
    }

    return post;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Check if post exists and user has permission
    await this.validateUserCanEditPost(userId, id);

    await this.prisma.post.delete({
      where: { id },
    });
  }

  async togglePin(id: string, userId: string): Promise<PostWithRelations> {
    // Only admins can pin/unpin posts
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can pin/unpin posts');
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { isPinned: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.update(id, { isPinned: !post.isPinned }, userId);
  }

  // Private helper methods

  private buildOrderBy(filters: PostFilterDto): Prisma.PostOrderByWithRelationInput[] {
    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];

    // Primary sort
    if (filters.sortBy === 'createdAt') {
      orderBy.push({ createdAt: filters.sortOrder });
    } else if (filters.sortBy === 'publishedAt') {
      orderBy.push({ publishedAt: filters.sortOrder });
    } else if (filters.sortBy === 'priority') {
      orderBy.push({ priority: filters.sortOrder });
    }

    // Secondary sort: always include createdAt as tiebreaker if not primary
    if (filters.sortBy !== 'createdAt') {
      orderBy.push({ createdAt: 'desc' });
    }

    return orderBy;
  }

  private async validateCreatePostDto(dto: Partial<CreatePostDto>, authorId: string): Promise<void> {
    if (!dto.scope) return;

    // Validate department scope
    if (dto.scope === PostScope.DEPARTMENT) {
      if (!dto.departmentId) {
        throw new BadRequestException('Department ID is required for department-scoped posts');
      }

      // Verify department exists
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });

      if (!department) {
        throw new BadRequestException('Invalid department ID');
      }
    }

    // Validate year scope
    if (dto.scope === PostScope.YEAR) {
      if (!dto.targetYear) {
        throw new BadRequestException('Target year is required for year-scoped posts');
      }

      if (dto.targetYear < 1 || dto.targetYear > 4) {
        throw new BadRequestException('Target year must be between 1 and 4');
      }
    }
  }

  private async validateUserCanEditPost(userId: string, postId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Admins can edit any post
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Check if post exists and user is the author
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
  }

  private async associateFilesWithPost(fileIds: string[], postId: string, userId: string): Promise<void> {
    // Verify all files exist and belong to the user
    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploadedBy: userId,
        uploadContext: 'POST',
      },
    });

    if (files.length !== fileIds.length) {
      throw new BadRequestException('Some files not found or do not belong to you');
    }

    // Associate files with the post
    await this.prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { contextId: postId },
    });
  }

  private async updatePostAttachments(postId: string, newFileIds: string[], userId: string): Promise<void> {
    // Remove existing associations
    await this.prisma.file.updateMany({
      where: { contextId: postId },
      data: { contextId: null },
    });

    // Add new associations if provided
    if (newFileIds.length > 0) {
      await this.associateFilesWithPost(newFileIds, postId, userId);
    }
  }
}
