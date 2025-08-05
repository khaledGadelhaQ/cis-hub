import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UserRole } from '../../../common/enums/user_role.enum';

@Injectable()
export class PostAuthorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!postId) {
      throw new ForbiddenException('Post ID is required');
    }

    // Admins can edit any post
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if the post exists and get the author
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only the author can edit their own post (unless admin)
    if (post.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return true;
  }
}
