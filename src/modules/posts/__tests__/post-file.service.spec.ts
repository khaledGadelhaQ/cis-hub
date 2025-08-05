import { Test, TestingModule } from '@nestjs/testing';
import { PostFileService } from '../services/post-file.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FilesService } from '../../files/services/files.service';
import { FileValidationService } from '../../files/services/file-validation.service';
import { StorageService } from '../../files/services/storage.service';
import { UploadContext } from '../../../common/enums/upload_context.enum';
import { UserRole } from '../../../common/enums/user_role.enum';
import { PostFileUploadDto } from '../dto/post-file.dto';

// Helper function to create mock files
const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => {
  return {
    fieldname: 'files',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: '/tmp',
    filename: 'test.pdf',
    path: '/tmp/test.pdf',
    buffer: Buffer.from('test'),
    stream: null,
    ...overrides,
  } as unknown as Express.Multer.File;
};

describe('PostFileService', () => {
  let service: PostFileService;
  let prismaService: PrismaService;
  let filesService: FilesService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    file: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockFilesService = {
    uploadFile: jest.fn(),
  };

  const mockFileValidationService = {
    validateFile: jest.fn(),
  };

  const mockStorageService = {
    storeFile: jest.fn(),
    getFileStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostFileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: FileValidationService,
          useValue: mockFileValidationService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<PostFileService>(PostFileService);
    prismaService = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadPostFiles', () => {
    it('should upload files for a post successfully', async () => {
      const mockFiles: Express.Multer.File[] = [createMockFile()];

      const uploadDto: PostFileUploadDto = {
        postId: 'post-1',
        isPublic: false,
      };

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      const mockUploadResult = {
        id: 'file-1',
        originalName: 'test.pdf',
        filePath: '/uploads/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.count.mockResolvedValue(0);
      mockFileValidationService.validateFile.mockResolvedValue(true);
      mockFilesService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await service.uploadPostFiles(mockFiles, uploadDto, 'user-1');

      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        select: {
          id: true,
          authorId: true,
          departmentId: true,
          scope: true,
        },
      });

      expect(mockFileValidationService.validateFile).toHaveBeenCalledWith(
        mockFiles[0],
        UploadContext.POST,
      );

      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(
        mockFiles[0],
        {
          context: UploadContext.POST,
          contextId: 'post-1',
          isPublic: false,
        },
        'user-1',
      );

      expect(result).toEqual([mockUploadResult]);
    });

    it('should throw error if post not found', async () => {
      const mockFiles: Express.Multer.File[] = [];
      const uploadDto: PostFileUploadDto = {
        postId: 'non-existent',
        isPublic: false,
      };

      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadPostFiles(mockFiles, uploadDto, 'user-1'),
      ).rejects.toThrow('Post not found');
    });

    it('should throw error if file count exceeds limit', async () => {
      const mockFiles: Express.Multer.File[] = Array(11).fill(null).map(() => createMockFile());

      const uploadDto: PostFileUploadDto = {
        postId: 'post-1',
        isPublic: false,
      };

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.count.mockResolvedValue(0);

      await expect(
        service.uploadPostFiles(mockFiles, uploadDto, 'user-1'),
      ).rejects.toThrow('Post cannot have more than 10 attachments');
    });
  });

  describe('associateFilesWithPost', () => {
    it('should associate existing files with a post', async () => {
      const fileIds = ['file-1', 'file-2'];
      const postId = 'post-1';
      const userId = 'user-1';

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      const mockFiles = [
        { id: 'file-1', uploadedBy: 'user-1' },
        { id: 'file-2', uploadedBy: 'user-1' },
      ];

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.findMany.mockResolvedValue(mockFiles);
      mockPrismaService.file.count.mockResolvedValue(0);
      mockPrismaService.file.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.associateFilesWithPost(fileIds, postId, userId);

      expect(mockPrismaService.file.updateMany).toHaveBeenCalledWith({
        where: { id: { in: fileIds } },
        data: { contextId: postId },
      });

      expect(result).toEqual({ associatedCount: 2 });
    });
  });

  describe('removePostAttachments', () => {
    it('should remove specific files from a post', async () => {
      const attachmentDto = {
        postId: 'post-1',
        fileIds: ['file-1', 'file-2'],
      };

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.removePostAttachments(attachmentDto, 'user-1');

      expect(mockPrismaService.file.updateMany).toHaveBeenCalledWith({
        where: {
          contextId: 'post-1',
          uploadContext: UploadContext.POST,
          id: { in: ['file-1', 'file-2'] },
          uploadedBy: 'user-1',
        },
        data: { contextId: null },
      });

      expect(result).toEqual({ removedCount: 2 });
    });

    it('should allow admin to remove any files', async () => {
      const attachmentDto = {
        postId: 'post-1',
        fileIds: ['file-1'],
      };

      const mockPost = {
        id: 'post-1',
        authorId: 'user-2',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'admin-1',
        role: UserRole.ADMIN,
        departmentId: 'dept-1',
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removePostAttachments(attachmentDto, 'admin-1');

      expect(mockPrismaService.file.updateMany).toHaveBeenCalledWith({
        where: {
          contextId: 'post-1',
          uploadContext: UploadContext.POST,
          id: { in: ['file-1'] },
        },
        data: { contextId: null },
      });

      expect(result).toEqual({ removedCount: 1 });
    });
  });

  describe('getPostAttachments', () => {
    it('should return post attachments with uploader info', async () => {
      const postId = 'post-1';
      const userId = 'user-1';

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      const mockAttachments = [
        {
          id: 'file-1',
          originalName: 'document.pdf',
          filePath: '/uploads/document.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          uploader: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'file-2',
          originalName: 'image.jpg',
          filePath: '/uploads/image.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          uploader: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.findMany.mockResolvedValue(mockAttachments);

      const result = await service.getPostAttachments(postId, userId);

      expect(mockPrismaService.file.findMany).toHaveBeenCalledWith({
        where: {
          contextId: 'post-1',
          uploadContext: UploadContext.POST,
        },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      expect(result).toEqual(mockAttachments);
    });
  });

  describe('downloadPostAttachment', () => {
    it('should return file metadata for download', async () => {
      const fileId = 'file-1';
      const userId = 'user-1';

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      const mockFile = {
        id: 'file-1',
        originalName: 'document.pdf',
        filePath: '/uploads/document.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        post: mockPost,
      };

      mockPrismaService.file.findFirst.mockResolvedValue(mockFile);
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.downloadPostAttachment(fileId, userId);

      expect(mockPrismaService.file.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'file-1',
          uploadContext: UploadContext.POST,
        },
        include: {
          post: {
            select: {
              id: true,
              authorId: true,
              departmentId: true,
              scope: true,
            },
          },
        },
      });

      expect(result).toEqual({
        filePath: '/uploads/document.pdf',
        originalName: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: 2048,
      });
    });

    it('should throw error if file not found', async () => {
      const fileId = 'non-existent';
      const userId = 'user-1';

      mockPrismaService.file.findFirst.mockResolvedValue(null);

      await expect(
        service.downloadPostAttachment(fileId, userId),
      ).rejects.toThrow('File not found');
    });
  });

  describe('getPostFileStatistics', () => {
    it('should return file statistics for a post', async () => {
      const postId = 'post-1';
      const userId = 'user-1';

      const mockPost = {
        id: 'post-1',
        authorId: 'user-1',
        departmentId: 'dept-1',
        scope: 'DEPARTMENT',
      };

      const mockUser = {
        id: 'user-1',
        role: UserRole.PROFESSOR,
        departmentId: 'dept-1',
      };

      const mockStats = {
        _count: { id: 5 },
        _sum: { fileSize: 10240 },
      };

      const mockFileTypes = [
        { mimeType: 'application/pdf', _count: { id: 3 } },
        { mimeType: 'image/jpeg', _count: { id: 2 } },
      ];

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.file.aggregate.mockResolvedValue(mockStats);
      mockPrismaService.file.groupBy.mockResolvedValue(mockFileTypes);

      const result = await service.getPostFileStatistics(postId, userId);

      expect(result).toEqual({
        totalFiles: 5,
        totalSize: 10240,
        fileTypes: [
          { mimeType: 'application/pdf', count: 3 },
          { mimeType: 'image/jpeg', count: 2 },
        ],
      });
    });
  });
});
