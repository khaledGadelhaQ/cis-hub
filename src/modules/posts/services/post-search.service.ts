import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PostFilterDto } from '../dto';
import { UserVisibilityContext, PostWithRelations, PaginatedResponse } from '../types/posts.types';
import { PostVisibilityService } from './post-visibility.service';

@Injectable()
export class PostSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postVisibilityService: PostVisibilityService,
  ) {}

  /**
   * Enhanced search with full-text capabilities
   */
  async searchPosts(
    query: string, 
    context: UserVisibilityContext, 
    filters: PostFilterDto
  ): Promise<PaginatedResponse<PostWithRelations>> {
    if (!query || query.trim().length === 0) {
      return {
        data: [],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 0,
      };
    }

    const searchConditions: Prisma.PostWhereInput = {
      OR: [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { content: { contains: query.trim(), mode: 'insensitive' } },
      ],
    };

    const whereClause: Prisma.PostWhereInput = {
      AND: [
        this.postVisibilityService.buildVisibilityFilter(context),
        this.postVisibilityService.buildUserFilters(filters),
        searchConditions,
      ],
    };

    const includeClause = {
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
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: this.postVisibilityService.buildOrderBy(filters),
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }) as Promise<PostWithRelations[]>,
      this.prisma.post.count({ where: whereClause }),
    ]);

    return {
      data: posts,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  /**
   * Get search suggestions based on existing posts
   */
  async getSearchSuggestions(
    query: string, 
    context: UserVisibilityContext, 
    limit: number = 5
  ): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const whereClause: Prisma.PostWhereInput = {
      AND: [
        this.postVisibilityService.buildVisibilityFilter(context),
        {
          OR: [
            { title: { contains: query.trim(), mode: 'insensitive' } },
            { content: { contains: query.trim(), mode: 'insensitive' } },
          ],
        },
      ],
    };

    const posts = await this.prisma.post.findMany({
      where: whereClause,
      select: {
        title: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return posts.map(post => post.title);
  }

  /**
   * Advanced filter combinations for complex queries
   */
  async getPostsByMultipleFilters(
    context: UserVisibilityContext,
    filters: {
      departments?: string[];
      years?: number[];
      priorities?: string[];
      postTypes?: string[];
      authorIds?: string[];
      dateRange?: {
        from: Date;
        to: Date;
      };
    },
    pagination: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<PostWithRelations>> {
    const whereConditions: Prisma.PostWhereInput[] = [
      this.postVisibilityService.buildVisibilityFilter(context),
    ];

    // Multiple departments filter
    if (filters.departments && filters.departments.length > 0) {
      whereConditions.push({
        departmentId: { in: filters.departments },
      });
    }

    // Multiple years filter
    if (filters.years && filters.years.length > 0) {
      whereConditions.push({
        targetYear: { in: filters.years },
      });
    }

    // Multiple priorities filter
    if (filters.priorities && filters.priorities.length > 0) {
      whereConditions.push({
        priority: { in: filters.priorities as any },
      });
    }

    // Multiple post types filter
    if (filters.postTypes && filters.postTypes.length > 0) {
      whereConditions.push({
        postType: { in: filters.postTypes as any },
      });
    }

    // Multiple authors filter
    if (filters.authorIds && filters.authorIds.length > 0) {
      whereConditions.push({
        authorId: { in: filters.authorIds },
      });
    }

    // Date range filter
    if (filters.dateRange) {
      whereConditions.push({
        createdAt: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to,
        },
      });
    }

    const whereClause: Prisma.PostWhereInput = {
      AND: whereConditions,
    };

    const orderBy: Prisma.PostOrderByWithRelationInput[] = [];
    if (pagination.sortBy === 'createdAt') {
      orderBy.push({ createdAt: pagination.sortOrder || 'desc' });
    } else if (pagination.sortBy === 'priority') {
      orderBy.push({ priority: pagination.sortOrder || 'desc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
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
        orderBy,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }) as Promise<PostWithRelations[]>,
      this.prisma.post.count({ where: whereClause }),
    ]);

    return {
      data: posts,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }
}
