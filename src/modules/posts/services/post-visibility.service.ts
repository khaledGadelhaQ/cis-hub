import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../../common/enums/user_role.enum';
import { PostScope } from '../../../common/enums/post_scope.enum';
import { UserVisibilityContext } from '../types/posts.types';
import { PostFilterDto } from '../dto';

@Injectable()
export class PostVisibilityService {
  
  /**
   * Builds visibility filter based on user context
   * Implements strict department isolation for students
   */
  buildVisibilityFilter(context: UserVisibilityContext): Prisma.PostWhereInput {
    // Admins can see everything
    if (context.canSeeAllDepartments) {
      return {};
    }

    const conditions: Prisma.PostWhereInput[] = [];

    // Everyone can see global posts
    conditions.push({ scope: PostScope.GLOBAL });

    // Users can see posts in their department ONLY (strict isolation)
    if (context.departmentId) {
      conditions.push({
        AND: [
          { scope: PostScope.DEPARTMENT },
          { departmentId: context.departmentId },
        ],
      });
    }

    // Users can see posts for their year
    if (context.currentYear) {
      conditions.push({
        AND: [
          { scope: PostScope.YEAR },
          { targetYear: context.currentYear },
        ],
      });
    }

    // TAs and Professors can see their own posts regardless of scope
    if ([UserRole.TA, UserRole.PROFESSOR].includes(context.role as UserRole)) {
      conditions.push({ authorId: context.userId });
    }

    return { OR: conditions };
  }

  /**
   * Builds user-provided filters for posts
   */
  buildUserFilters(filters: PostFilterDto): Prisma.PostWhereInput {
    const conditions: Prisma.PostWhereInput = {};

    if (filters.postType) {
      conditions.postType = filters.postType;
    }

    if (filters.scope) {
      conditions.scope = filters.scope;
    }

    if (filters.departmentId) {
      conditions.departmentId = filters.departmentId;
    }

    if (filters.targetYear) {
      conditions.targetYear = filters.targetYear;
    }

    if (filters.priority) {
      conditions.priority = filters.priority;
    }

    if (filters.isPinned !== undefined) {
      conditions.isPinned = filters.isPinned;
    }

    if (filters.authorId) {
      conditions.authorId = filters.authorId;
    }

    if (filters.search) {
      conditions.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return conditions;
  }

  /**
   * Builds order by clause for posts
   */
  buildOrderBy(filters: PostFilterDto): Prisma.PostOrderByWithRelationInput[] {
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

  /**
   * Checks if user can view a specific post
   */
  async canUserViewPost(context: UserVisibilityContext, post: { scope: PostScope; departmentId: string | null; targetYear: number | null; authorId: string }): Promise<boolean> {
    // Admins can see everything
    if (context.canSeeAllDepartments) {
      return true;
    }

    // Global posts are visible to everyone
    if (post.scope === PostScope.GLOBAL) {
      return true;
    }

    // Department posts: strict isolation
    if (post.scope === PostScope.DEPARTMENT) {
      return post.departmentId === context.departmentId;
    }

    // Year posts: user's year only
    if (post.scope === PostScope.YEAR) {
      return post.targetYear === context.currentYear;
    }

    // TAs and Professors can see their own posts
    if ([UserRole.TA, UserRole.PROFESSOR].includes(context.role as UserRole)) {
      return post.authorId === context.userId;
    }

    return false;
  }

  /**
   * Gets visible post IDs for a user (for complex queries)
   */
  async getVisiblePostIds(context: UserVisibilityContext, filters: PostFilterDto): Promise<string[]> {
    // This method can be used for more complex queries where we need to pre-filter post IDs
    // For now, we'll rely on the buildVisibilityFilter method
    // But this could be useful for performance optimization in the future
    return [];
  }
}
