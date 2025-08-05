import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostNotificationService } from '../services/post-notification.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('PostNotificationService', () => {
  let service: PostNotificationService;

  beforeEach(async () => {
    const mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
      },
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostNotificationService,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PostNotificationService>(PostNotificationService);
  });

  describe('service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have event handler methods', () => {
      expect(service.handlePostCreated).toBeDefined();
      expect(service.handlePostUpdated).toBeDefined();
      expect(service.handlePostFileUploaded).toBeDefined();
      expect(service.handlePostPinned).toBeDefined();
      expect(service.sendPostDigest).toBeDefined();
    });
  });
});
