import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../posts.controller';
import { PostsService } from '../posts.service';
import { PostCreationGuard } from '../guards/post-creation.guard';
import { PostAuthorGuard } from '../guards/post-author.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePostDto } from '../dto';
import { PostType } from '../../../common/enums/post_type.enum';
import { PostScope } from '../../../common/enums/post_scope.enum';
import { Priority } from '../../../common/enums/priority.enum';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockPostsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    togglePin: jest.fn(),
  };

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        PostCreationGuard,
        PostAuthorGuard,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createPostDto: CreatePostDto = {
        title: 'Test Post',
        content: 'This is a test post',
        postType: PostType.ANNOUNCEMENT,
        scope: PostScope.GLOBAL,
        priority: Priority.MEDIUM,
      };

      const mockRequest = {
        user: { id: 'user-1' },
      };

      const expectedResult = {
        id: 'post-1',
        ...createPostDto,
        authorId: 'user-1',
        author: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        attachments: [],
      };

      mockPostsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockRequest, createPostDto);

      expect(service.create).toHaveBeenCalledWith(createPostDto, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      const mockRequest = {
        user: { id: 'user-1' },
      };

      const mockFilters = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      mockPostsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockRequest, mockFilters as any);

      expect(service.findAll).toHaveBeenCalledWith(mockFilters, 'user-1');
      expect(result).toEqual(expectedResult);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
