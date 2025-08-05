import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserContextService } from '../services/user-context.service';
import { PostVisibilityService } from '../services/post-visibility.service';
import { PostSearchService } from '../services/post-search.service';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
    file: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockUserContextService = {
    getUserVisibilityContext: jest.fn(),
    validateUserCanAccessDepartment: jest.fn(),
  };

  const mockPostVisibilityService = {
    buildVisibilityFilter: jest.fn(),
    buildUserFilters: jest.fn(),
  };

  const mockPostSearchService = {
    searchPosts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: UserContextService,
          useValue: mockUserContextService,
        },
        {
          provide: PostVisibilityService,
          useValue: mockPostVisibilityService,
        },
        {
          provide: PostSearchService,
          useValue: mockPostSearchService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createPostDto = {
        title: 'Test Post',
        content: 'Test content',
        postType: 'ANNOUNCEMENT',
        scope: 'GLOBAL',
        priority: 'MEDIUM',
      };

      const mockUserContext = {
        userId: 'user-1',
        role: 'PROFESSOR',
        departmentId: 'dept-1',
        currentYear: null,
        canSeeAllDepartments: false,
        canCreateForAnyDepartment: true,
      };

      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        postType: 'ANNOUNCEMENT',
        scope: 'GLOBAL',
        priority: 'MEDIUM',
        createdAt: new Date(),
        author: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        department: null,
        attachments: [],
      };

      mockUserContextService.getUserVisibilityContext.mockResolvedValue(mockUserContext);
      mockUserContextService.validateUserCanAccessDepartment.mockResolvedValue(true);
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create(createPostDto as any, 'user-1');

      expect(mockUserContextService.getUserVisibilityContext).toHaveBeenCalledWith('user-1');
      expect(mockPrismaService.post.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('post.created', expect.any(Object));
      expect(result).toEqual(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const filters = { page: 1, limit: 10 };
      const mockUserContext = {
        userId: 'user-1',
        role: 'STUDENT',
        departmentId: 'dept-1',
        currentYear: 2,
        canSeeAllDepartments: false,
        canCreateForAnyDepartment: false,
      };

      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post',
          content: 'Test content',
          author: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
          department: { id: 'dept-1', name: 'Computer Science', code: 'CS' },
          attachments: [],
        },
      ];

      mockUserContextService.getUserVisibilityContext.mockResolvedValue(mockUserContext);
      mockPostVisibilityService.buildVisibilityFilter.mockResolvedValue({});
      mockPostVisibilityService.buildUserFilters.mockReturnValue({});
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findAll(filters as any, 'user-1');

      expect(mockUserContextService.getUserVisibilityContext).toHaveBeenCalledWith('user-1');
      expect(mockPostVisibilityService.buildVisibilityFilter).toHaveBeenCalledWith(mockUserContext);
      expect(result).toEqual({
        data: mockPosts,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
