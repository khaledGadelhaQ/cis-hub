# News/Feed Module Implementation Roadmap**### User Roles & Permissions
1. **Students**: Read access to relevant posts based on department/year
2. **TAs**: Can create posts + read access (same permissions as professors)
3. **Professors**: Can create any type of post + read access
4. **Admins**: Full CRUD access + moderation capabilities

### Content Scoping Rules
1. **GLOBAL**: Visible to all users (university-wide announcements)
2. **DEPARTMENT**: Visible to users in specific department (strict isolation - CS students only see CS posts)
3. **YEAR**: Visible to users in specific academic year (1st, 2nd, 3rd, 4th)ssions Structure:**
- **Students**: Read-only access to posts relevant to their department/year
- **TAs**: Can create posts + read access (same permissions as professors)
- **Professors**: Can create any type of post + read access
- **Admins**: Full CRUD + moderation capabilitiesExecutive Summary

This roadmap outlines the complete implementation of the News/Feed module for the MU Compass API. The module will serve as a centralized content distribution system for academic announcements, news, events, and general communications within the university ecosystem.

## Current State Analysis

### Existing Infrastructure
- ✅ **Prisma Schema**: Complete Post model with enums (PostType, PostScope, Priority)
- ✅ **File System**: Centralized file module for attachments integration
- ✅ **Authentication**: JWT-based auth with role-based access control
- ✅ **Notification System**: FCM-based notifications with topic subscriptions
- ✅ **Database Relations**: User, Department, File relations properly defined

### Schema Foundation
```prisma
model Post {
  id           String    @id @default(cuid())
  title        String
  content      String
  authorId     String
  postType     PostType     // ANNOUNCEMENT, EVENT, NEWS, URGENT, GENERAL
  scope        PostScope    // DEPARTMENT, YEAR, GLOBAL
  departmentId String?      // For department-specific posts
  targetYear   Int?         // For year-specific posts (1, 2, 3, 4)
  priority     Priority     // LOW, MEDIUM, HIGH, URGENT
  isPinned     Boolean      // Admin pinning capability
  publishedAt  DateTime?    // Scheduled publishing
  createdAt    DateTime
  updatedAt    DateTime
  
  // Relations
  author      User
  department  Department?
  attachments File[]       // File relation already established
}
```

## Business Logic Requirements Analysis

### User Roles & Permissions
1. **Students**: Read access to relevant posts based on department/year
2. **TAs**: Read access + potential limited posting for section announcements
3. **Professors**: Read + Write access for course-related announcements
4. **Admins**: Full CRUD access + moderation capabilities

### Content Scoping Rules
1. **GLOBAL**: Visible to all users (university-wide announcements)
2. **DEPARTMENT**: Visible to users in specific department (CS, IS, IT, GE)
3. **YEAR**: Visible to users in specific academic year (1st, 2nd, 3rd, 4th)

### Post Types & Use Cases
1. **ANNOUNCEMENT**: Official university/department announcements
2. **EVENT**: Campus events, deadlines, important dates
3. **NEWS**: General news, achievements, updates
4. **URGENT**: Emergency notifications, critical updates
5. **GENERAL**: General community posts, discussions

## Implementation Roadmap

### Phase 1: Core Module Foundation (Days 1-2)
**Goal**: Establish basic CRUD operations and module structure

#### 1.1 Module Structure Creation
```
src/modules/posts/
├── posts.module.ts
├── posts.controller.ts
├── posts.service.ts
├── dto/
│   ├── create-post.dto.ts
│   ├── update-post.dto.ts
│   ├── post-filter.dto.ts
│   └── index.ts
├── guards/
│   ├── post-author.guard.ts
│   └── post-creation.guard.ts
└── __tests__/
    ├── posts.controller.spec.ts
    └── posts.service.spec.ts
```

#### 1.2 Core DTOs Implementation
```typescript
// create-post.dto.ts
export class CreatePostDto {
  title: string;
  content: string;
  postType: PostType;
  scope: PostScope;
  departmentId?: string;
  targetYear?: number;
  priority: Priority;
  publishedAt?: Date;      // For scheduling
  attachmentIds?: string[]; // File IDs to associate
}

// post-filter.dto.ts
export class PostFilterDto {
  postType?: PostType;
  scope?: PostScope;
  departmentId?: string;
  targetYear?: number;
  priority?: Priority;
  isPinned?: boolean;
  authorId?: string;
  page?: number;
  limit?: number;
  search?: string;        // Search in title/content
  sortBy?: 'createdAt' | 'publishedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}
```

#### 1.3 Service Layer Implementation
```typescript
// Core methods to implement
class PostsService {
  async create(authorId: string, dto: CreatePostDto): Promise<Post>
  async findAll(filters: PostFilterDto, userId: string): Promise<PaginatedResponse<Post>>
  async findById(id: string, userId: string): Promise<Post>
  async update(id: string, dto: UpdatePostDto, userId: string): Promise<Post>
  async delete(id: string, userId: string): Promise<void>
  async togglePin(id: string, userId: string): Promise<Post>
  
  // Business logic methods
  async getVisiblePosts(userId: string, filters: PostFilterDto): Promise<Post[]>
  async validateUserCanCreatePost(userId: string, dto: CreatePostDto): Promise<boolean>
  async validateUserCanEditPost(userId: string, postId: string): Promise<boolean>
}
```

#### 1.4 Authentication & Authorization Guards
```typescript
// post-creation.guard.ts - Validates user can create posts
export class PostCreationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    // Only TAs, Professors and Admins can create posts
    return ['TA', 'PROFESSOR', 'ADMIN'].includes(user.role);
  }
}

// post-author.guard.ts - Validates user owns the post or is admin
export class PostAuthorGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if user is author or admin
  }
}
```

#### 1.5 Controller Implementation
```typescript
@Controller('posts')
export class PostsController {
  @Post()
  @UseGuards(JwtAuthGuard, PostCreationGuard)
  async create(@Request() req, @Body() dto: CreatePostDto): Promise<Post>

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req, @Query() filters: PostFilterDto): Promise<PaginatedResponse<Post>>

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string): Promise<Post>

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PostAuthorGuard)
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePostDto): Promise<Post>

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PostAuthorGuard)
  async remove(@Request() req, @Param('id') id: string): Promise<void>

  @Post(':id/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async togglePin(@Request() req, @Param('id') id: string): Promise<Post>
}
```

### Phase 2: Advanced Filtering & Visibility Logic (Days 3-4)
**Goal**: Implement sophisticated content filtering based on user context

#### 2.1 User Context Service
```typescript
class UserContextService {
  async getUserVisibilityContext(userId: string): Promise<UserVisibilityContext> {
    // Get user's department, year, role
    // Note: Graduated students are removed from system, so no special handling needed
    // Return context for filtering posts with strict department isolation
  }
}

interface UserVisibilityContext {
  userId: string;
  role: UserRole;
  departmentId: string;
  currentYear: number;
  canSeeAllDepartments: boolean; // Only true for admins
  canCreateForAnyDepartment: boolean; // True for professors and admins
}
```

#### 2.2 Post Visibility Logic
```typescript
class PostVisibilityService {
  async getVisiblePostIds(context: UserVisibilityContext, filters: PostFilterDto): Promise<string[]> {
    // Complex query building based on:
    // - User's department (can see DEPARTMENT scope for their dept ONLY - strict isolation)
    // - User's year (can see YEAR scope for their year)
    // - GLOBAL scope (everyone can see)
    // - Admin override (can see everything)
    // - Professor/TA can see their own posts regardless of scope
  }

  async applyVisibilityFilter(query: Prisma.PostFindManyArgs, context: UserVisibilityContext): Prisma.PostFindManyArgs {
    // Apply WHERE conditions for strict department isolation
    // Students: Global + own department + own year only
    // TAs: Global + own department + own posts
    // Professors: Global + own posts (they can create for any dept)
    // Admins: Everything
  }
}
```

#### 2.3 Smart Filtering Implementation
```typescript
// In PostsService
async findAll(filters: PostFilterDto, userId: string): Promise<PaginatedResponse<Post>> {
  const userContext = await this.userContextService.getUserVisibilityContext(userId);
  
  const query: Prisma.PostFindManyArgs = {
    where: {
      AND: [
        // Visibility filters
        this.buildVisibilityFilter(userContext),
        // User-provided filters
        this.buildUserFilters(filters),
      ]
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      department: true,
      attachments: true,
    },
    orderBy: this.buildOrderBy(filters),
    skip: (filters.page - 1) * filters.limit,
    take: filters.limit,
  };

  const [posts, total] = await Promise.all([
    this.prisma.post.findMany(query),
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
```

#### 2.4 Search Functionality
```typescript
// Full-text search implementation
async searchPosts(query: string, userId: string, filters: PostFilterDto): Promise<Post[]> {
  // Implement PostgreSQL full-text search or simple LIKE queries
  const searchCondition = query ? {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ]
  } : {};

  // Combine with visibility filters
}
```

### Phase 3: File Attachments Integration (Day 5)
**Goal**: Seamlessly integrate with existing file system

#### 3.1 File Association Logic
```typescript
// In PostsService.create()
async create(authorId: string, dto: CreatePostDto): Promise<Post> {
  const post = await this.prisma.post.create({
    data: {
      title: dto.title,
      content: dto.content,
      authorId,
      postType: dto.postType,
      scope: dto.scope,
      departmentId: dto.departmentId,
      targetYear: dto.targetYear,
      priority: dto.priority,
      publishedAt: dto.publishedAt,
    },
  });

  // Associate uploaded files if provided
  if (dto.attachmentIds?.length > 0) {
    await this.filesService.associateFilesWithContext(
      dto.attachmentIds,
      'POST',
      post.id,
      authorId
    );
  }

  return this.findById(post.id, authorId);
}
```

#### 3.2 File Access Control
```typescript
// Extend file access validation for posts
class PostFileAccessService {
  async validateUserCanAccessPostFile(userId: string, fileId: string): Promise<boolean> {
    // Check if file belongs to a post the user can see
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { post: true }
    });

    if (!file?.post) return false;
    
    return this.postsService.validateUserCanViewPost(userId, file.post.id);
  }
}
```

### Phase 4: Notification Integration (Day 6)
**Goal**: Integrate with existing notification system for post alerts (no approval workflow needed)

#### 4.1 Post Event System
```typescript
// Post events for notification triggers
interface PostCreatedEvent {
  postId: string;
  authorId: string;
  postType: PostType;
  scope: PostScope;
  departmentId?: string;
  targetYear?: number;
  priority: Priority;
}

// In PostsService
async create(authorId: string, dto: CreatePostDto): Promise<Post> {
  // ... create post logic
  // No approval needed since only TAs/Professors/Admins can create posts

  // Emit event for notifications
  this.eventEmitter.emit('post.created', {
    postId: post.id,
    authorId,
    postType: dto.postType,
    scope: dto.scope,
    departmentId: dto.departmentId,
    targetYear: dto.targetYear,
    priority: dto.priority,
  } as PostCreatedEvent);

  return post;
}
```

#### 4.2 Notification Automation Service Extension
```typescript
@Injectable()
export class PostNotificationService {
  @OnEvent('post.created')
  async handlePostCreated(event: PostCreatedEvent) {
    // Determine who should receive notifications
    const recipients = await this.getPostRecipients(event);
    
    // Send notifications based on priority
    if (event.priority === Priority.URGENT) {
      await this.sendUrgentNotifications(recipients, event);
    } else {
      await this.sendStandardNotifications(recipients, event);
    }
  }

  private async getPostRecipients(event: PostCreatedEvent): Promise<string[]> {
    switch (event.scope) {
      case PostScope.GLOBAL:
        return this.getAllActiveUsers(); // All active users (graduated users already removed)
      case PostScope.DEPARTMENT:
        return this.getUsersByDepartment(event.departmentId); // Strict department isolation
      case PostScope.YEAR:
        return this.getUsersByYear(event.targetYear);
    }
  }
}
```

#### 4.3 Topic-Based Notifications
```typescript
// Automatic topic subscription for posts
class PostTopicService {
  getTopicName(scope: PostScope, departmentId?: string, targetYear?: number): string {
    switch (scope) {
      case PostScope.GLOBAL:
        return 'posts_global';
      case PostScope.DEPARTMENT:
        return `posts_dept_${departmentId}`;
      case PostScope.YEAR:
        return `posts_year_${targetYear}`;
    }
  }

  async notifyPostTopic(event: PostCreatedEvent) {
    const topicName = this.getTopicName(event.scope, event.departmentId, event.targetYear);
    
    await this.notificationService.sendTopicNotification({
      topic: topicName,
      title: this.buildNotificationTitle(event),
      body: this.buildNotificationBody(event),
      data: {
        postId: event.postId,
        type: 'post_created',
        postType: event.postType,
        priority: event.priority,
      }
    });
  }
}
```

### Phase 5: Administrative Features (Day 7)
**Goal**: Implement admin moderation and management capabilities

#### 5.1 Post Moderation
```typescript
// Administrative endpoints
@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PostsAdminController {
  @Get()
  async getAllPosts(@Query() filters: AdminPostFilterDto): Promise<PaginatedResponse<Post>> {
    // Admin can see all posts regardless of visibility rules
  }

  @Post(':id/moderate')
  async moderatePost(@Param('id') id: string, @Body() dto: ModeratePostDto): Promise<Post> {
    // Hide/show, change priority, edit content, etc.
  }

  @Get('statistics')
  async getPostStatistics(): Promise<PostStatistics> {
    // Post counts by type, engagement metrics, etc.
  }

  @Post('bulk-actions')
  async bulkActions(@Body() dto: BulkPostActionDto): Promise<void> {
    // Bulk hide, delete, pin, etc.
  }
}
```

#### 5.2 Content Validation
```typescript
// Content moderation service
class PostModerationService {
  async validatePostContent(content: string, title: string): Promise<ValidationResult> {
    // Basic content validation
    // Could be extended with AI moderation in future
    return {
      isValid: true,
      warnings: [],
      suggestions: [],
    };
  }

  async flagPost(postId: string, reason: string, reportedBy: string): Promise<void> {
    // Flag system for inappropriate content
  }
}
```

### Phase 6: Performance & Caching (Day 8)
**Goal**: Optimize for performance and implement caching strategies

#### 6.1 Caching Strategy
```typescript
@Injectable()
export class PostsCacheService {
  // Cache frequently accessed posts
  async getCachedPost(postId: string): Promise<Post | null> {
    // Redis cache implementation
  }

  async setCachedPost(postId: string, post: Post): Promise<void> {
    // Cache with TTL based on post type and priority
  }

  async invalidatePostCache(postId: string): Promise<void> {
    // Cache invalidation on updates
  }

  // Cache user's visible posts list
  async getCachedUserFeed(userId: string, filters: PostFilterDto): Promise<Post[] | null> {
    // Cache user-specific feed
  }
}
```

#### 6.2 Database Optimization
```sql
-- Database indexes for performance
CREATE INDEX idx_posts_scope_department ON posts(scope, department_id) WHERE scope = 'DEPARTMENT';
CREATE INDEX idx_posts_scope_year ON posts(scope, target_year) WHERE scope = 'YEAR';
CREATE INDEX idx_posts_published_priority ON posts(published_at, priority) WHERE published_at IS NOT NULL;
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at);
CREATE INDEX idx_posts_type_pinned ON posts(post_type, is_pinned);

-- Full-text search index
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
```

#### 6.3 Pagination Optimization
```typescript
// Cursor-based pagination for better performance
interface CursorPaginationDto {
  cursor?: string;  // Last post ID from previous page
  limit: number;
  direction: 'before' | 'after';
}

async findAllWithCursor(userId: string, pagination: CursorPaginationDto): Promise<CursorPaginatedResponse<Post>> {
  // Implement cursor-based pagination for infinite scroll
}
```

## API Endpoints Specification

### Public Endpoints
```typescript
// Core CRUD
GET    /posts                    // Get filtered posts feed
GET    /posts/:id               // Get specific post
POST   /posts                   // Create new post (Professor/Admin only)
PATCH  /posts/:id              // Update post (Author/Admin only)
DELETE /posts/:id              // Delete post (Author/Admin only)

// Special actions
POST   /posts/:id/pin          // Pin/unpin post (Admin only)
GET    /posts/pinned           // Get all pinned posts
GET    /posts/search           // Search posts

// File related
GET    /posts/:id/attachments  // Get post attachments
POST   /posts/:id/attachments  // Add attachments to post
DELETE /posts/:id/attachments/:fileId // Remove attachment
```

### Admin Endpoints
```typescript
GET    /admin/posts                     // All posts (no visibility filtering)
GET    /admin/posts/statistics         // Post analytics
POST   /admin/posts/:id/moderate       // Moderate post
POST   /admin/posts/bulk-actions       // Bulk operations
GET    /admin/posts/flagged            // Flagged posts
```

## Error Handling Strategy

### Custom Exceptions
```typescript
export class PostNotFoundException extends HttpException {
  constructor(postId: string) {
    super(`Post with ID ${postId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class PostAccessDeniedException extends HttpException {
  constructor() {
    super('You do not have permission to access this post', HttpStatus.FORBIDDEN);
  }
}

export class PostCreationNotAllowedException extends HttpException {
  constructor(userRole: string) {
    super(`Users with role ${userRole} cannot create posts`, HttpStatus.FORBIDDEN);
  }
}
```

### Validation Pipeline
```typescript
// Global validation pipe for all DTOs
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validateCustomDecorators: true,
  }),
);
```

## Testing Strategy

### Unit Tests
```typescript
// posts.service.spec.ts
describe('PostsService', () => {
  describe('findAll', () => {
    it('should return only posts visible to student', async () => {
      // Test visibility filtering for students
    });
    
    it('should return all posts for admin', async () => {
      // Test admin can see everything
    });
    
    it('should apply department filtering correctly', async () => {
      // Test department-scoped posts
    });
  });
  
  describe('create', () => {
    it('should create post with attachments', async () => {
      // Test file association
    });
    
    it('should emit notification event', async () => {
      // Test event emission
    });
  });
});
```

### Integration Tests
```typescript
// posts.controller.e2e.spec.ts
describe('Posts API', () => {
  it('should not allow students to create posts', async () => {
    // Test authorization
  });
  
  it('should filter posts based on user department', async () => {
    // Test end-to-end visibility filtering
  });
  
  it('should send notifications when urgent post created', async () => {
    // Test notification integration
  });
});
```

## Monitoring & Analytics

### Metrics to Track
1. **Content Metrics**
   - Posts created per day/week/month
   - Post types distribution
   - Engagement rates (if future feature)

2. **Performance Metrics**
   - API response times
   - Database query performance
   - Cache hit rates

3. **User Behavior**
   - Posts viewed per user
   - Search queries
   - Filter usage patterns

### Logging Strategy
```typescript
// Structured logging for post operations
this.logger.log({
  action: 'post_created',
  postId: post.id,
  authorId,
  postType: dto.postType,
  scope: dto.scope,
  hasAttachments: dto.attachmentIds?.length > 0,
  timestamp: new Date().toISOString(),
});
```

## Security Considerations

### Input Validation
- HTML sanitization for post content
- File type validation for attachments
- Rate limiting for post creation
- Content length limits

### Access Control
- Role-based post creation (Professor/Admin only)
- Visibility rules enforcement
- File access validation
- Owner-based edit permissions

### Content Security
- XSS prevention in post content
- File upload security
- Content moderation hooks
- Audit trail for admin actions

## Future Enhancements

### Phase 7: Advanced Features (Future)
- **Rich Text Editor**: Markdown or WYSIWYG support
- **Post Reactions**: Like, helpful, etc.
- **Comments System**: Threaded discussions on posts
- **Post Templates**: Standardized announcement formats
- **Scheduled Posts**: Advanced scheduling with time zones
- **Post Analytics**: View counts, engagement metrics
- **Email Digest**: Weekly summary emails
- **Mobile Push**: Enhanced mobile notifications
- **Moderation AI**: Automated content flagging
- **Translation**: Multi-language support

## Risk Assessment

### Technical Risks
1. **Performance**: Large number of posts could slow queries
   - *Mitigation*: Pagination, caching, database indexes

2. **Storage**: File attachments could consume significant space
   - *Mitigation*: File size limits, cloud storage integration

3. **Notification Spam**: Too many notifications could annoy users
   - *Mitigation*: Smart batching, user preferences, quiet hours

### Business Risks
1. **Content Moderation**: Inappropriate content could be posted
   - *Mitigation*: Approval workflow for sensitive post types

2. **Information Overload**: Students might miss important posts
   - *Mitigation*: Priority system, pinning, smart filtering

## Success Metrics

### Technical Success
- ✅ API response times < 200ms for list endpoints
- ✅ Database queries < 50ms average
- ✅ 99.9% uptime
- ✅ Zero data loss incidents

### Business Success
- ✅ 90%+ of users engage with posts weekly
- ✅ Important announcements reach 95%+ of target audience
- ✅ <1% inappropriate content incidents
- ✅ Positive user feedback on content discoverability

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2 days | Core CRUD, Basic filtering |
| Phase 2 | 2 days | Advanced visibility, Search |
| Phase 3 | 1 day | File attachments integration |
| Phase 4 | 1 day | Notification integration |
| Phase 5 | 1 day | Admin features |
| Phase 6 | 1 day | Performance optimization |
| **Total** | **8 days** | **Complete posts module** |

## Conclusion

This roadmap provides a comprehensive plan for implementing a robust, scalable, and secure news/feed module that seamlessly integrates with the existing MU Compass ecosystem. The phased approach ensures we can deliver value incrementally while building a solid foundation for future enhancements.

The implementation leverages existing infrastructure (authentication, files, notifications) while introducing sophisticated content filtering and visibility rules that match the academic environment's needs.

**Recommendation**: Start with Phase 1 to establish the foundation and validate the business logic, then proceed through phases 2-6 for a complete, production-ready posts system.

---

## ✅ **Confirmed Business Logic Requirements**

Based on stakeholder feedback, the following business rules have been confirmed:

### **User Permissions (Updated)**
1. **Students**: Read-only access to posts relevant to their department/year
2. **TAs**: Can create posts + read access (same permissions as professors) ✅
3. **Professors**: Can create any type of post for any department/scope ✅
4. **Admins**: Full CRUD + moderation capabilities

### **Content Visibility (Updated)**
- **Strict Department Isolation**: CS students only see CS posts, IS students only see IS posts, etc. ✅
- **No Cross-Department Visibility**: Students cannot see other departments' announcements ✅
- **Global Posts**: University-wide announcements visible to all users
- **Year-Specific Posts**: Visible to students in that specific academic year

### **User Lifecycle (Updated)**
- **Graduated Students**: Completely removed from the system ✅
- **No Special Handling**: No need for graduated user status or archival

### **Content Creation (Updated)**
- **Professor Freedom**: Professors can post to any department/scope, not restricted to their teaching department ✅
- **No Approval Workflow**: Direct publishing since only trusted users (TAs/Professors/Admins) can create posts ✅

### **Notification Strategy (Updated)**
- **Standard Notifications**: No special urgent post handling or quiet hours bypass ✅
- **Topic-Based**: Use existing FCM topic system for post notifications
- **Simple Implementation**: No complex notification frequency rules needed

These requirements ensure a streamlined, secure, and department-focused news/feed system that aligns with the academic structure while maintaining simplicity and trust.
