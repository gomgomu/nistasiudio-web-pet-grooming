import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let healthController: HealthController;
  const mockPrismaService = {
    isHealthy: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return status ok and database status', async () => {
      const result = await healthController.check();
      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('PetFlow API');
      expect(result.version).toBe('0.1.0');
      expect(result.database).toBe('connected');
    });
  });
});
