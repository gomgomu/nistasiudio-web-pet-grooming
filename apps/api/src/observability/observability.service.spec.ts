import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityService } from './observability.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../notifications/queues/queue.service';

describe('ObservabilityService', () => {
  let service: ObservabilityService;
  let prisma: PrismaService;
  let queueService: QueueService;

  const mockPrisma = {
    tenant: {
      count: jest.fn().mockResolvedValue(5),
    },
    user: {
      count: jest.fn().mockResolvedValue(25),
    },
  };

  const mockQueueService = {
    getQueueMetrics: jest.fn().mockResolvedValue([
      { name: 'notification', waiting: 0, active: 1, completed: 10, failed: 0, delayed: 0 },
      { name: 'reminder', waiting: 2, active: 0, completed: 50, failed: 1, delayed: 0 },
      { name: 'campaign', waiting: 0, active: 0, completed: 5, failed: 0, delayed: 0 },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObservabilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<ObservabilityService>(ObservabilityService);
    prisma = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemMetrics', () => {
    it('should return valid runtime memory and CPU statistics', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(metrics.processMemory.heapUsedMb).toBeGreaterThan(0);
      expect(metrics.os.platform).toBeDefined();
      expect(metrics.os.cpus).toBeGreaterThan(0);
      expect(metrics.timestamp).toBeDefined();
    });
  });

  describe('getQueueMetrics', () => {
    it('should query queue metrics from QueueService', async () => {
      const queues = await service.getQueueMetrics();

      expect(queues).toBeDefined();
      expect(queues.length).toBe(3);
      expect(queueService.getQueueMetrics).toHaveBeenCalled();
    });
  });

  describe('getPlatformOverview', () => {
    it('should aggregate database, queue, and system metrics', async () => {
      const overview = await service.getPlatformOverview();

      expect(overview.status).toBe('HEALTHY');
      expect(overview.database.status).toBe('CONNECTED');
      expect(overview.tenantsCount).toBe(5);
      expect(overview.activeUsersCount).toBe(25);
      expect(overview.queues.length).toBe(3);
      expect(overview.system.processMemory.heapTotalMb).toBeGreaterThan(0);
    });

    it('should report UNHEALTHY when database fails', async () => {
      mockPrisma.tenant.count.mockRejectedValueOnce(new Error('Connection lost'));

      const overview = await service.getPlatformOverview();

      expect(overview.status).toBe('UNHEALTHY');
      expect(overview.database.status).toBe('DISCONNECTED');
    });
  });
});
