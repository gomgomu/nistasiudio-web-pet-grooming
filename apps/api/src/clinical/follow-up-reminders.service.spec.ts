import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FollowUpRemindersService } from './follow-up-reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../line/line.service';
import { QueueService } from '../notifications/queues/queue.service';

describe('FollowUpRemindersService (Clinical Follow-up & Recheck Reminders)', () => {
  let service: FollowUpRemindersService;
  let prisma: PrismaService;
  let lineService: LineService;

  const mockTenantId = 't1111111-1111-4111-a111-111111111111';
  const mockVisitId = 'v1111111-1111-4111-a111-111111111111';

  const mockCustomer = {
    id: 'c-1',
    firstName: 'คุณกนกวรรณ',
    lastName: 'ศรีสุข',
    phone: '089-111-2233',
    lineUserId: 'U_LINE_123',
  };

  const mockPet = {
    id: 'p-1',
    name: 'น้องโมจิ',
    species: 'DOG',
    breed: 'Pomeranian',
    customer: mockCustomer,
  };

  const mockBranch = {
    id: 'b-1',
    name: 'PetFlow สาขาทองหล่อ',
    phone: '02-123-4567',
  };

  const mockVet = {
    id: 'vet-1',
    firstName: 'น.สพ. วรปรัชญ์',
    lastName: 'เกียรติสกุล',
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const mockVisit = {
    id: mockVisitId,
    tenantId: mockTenantId,
    customerId: mockCustomer.id,
    petId: mockPet.id,
    branchId: mockBranch.id,
    veterinarianId: mockVet.id,
    visitNumber: 'VN-2026-0089',
    diagnosis: 'Otitis Externa',
    followUpDate: new Date(todayStr),
    followUpReason: 'นัดตรวจซ้ำ Ear Cytology',
    customer: mockCustomer,
    pet: mockPet,
    branch: mockBranch,
    veterinarian: mockVet,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpRemindersService,
        {
          provide: PrismaService,
          useValue: {
            clinicVisit: {
              findMany: jest.fn().mockResolvedValue([mockVisit]),
              findFirst: jest.fn().mockImplementation((args) => {
                if (args.where.id === mockVisitId && args.where.tenantId === mockTenantId) {
                  return Promise.resolve(mockVisit);
                }
                return Promise.resolve(null);
              }),
              update: jest.fn().mockResolvedValue({ ...mockVisit, followUpDate: null }),
            },
            notification: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
              count: jest.fn().mockResolvedValue(12),
            },
          },
        },
        {
          provide: LineService,
          useValue: {
            pushTextMessage: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: QueueService,
          useValue: {
            addNotificationJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
          },
        },
      ],
    }).compile();

    service = module.get<FollowUpRemindersService>(FollowUpRemindersService);
    prisma = module.get<PrismaService>(PrismaService);
    lineService = module.get<LineService>(LineService);
  });

  describe('getFollowUps', () => {
    it('should return list of follow-ups with due calculation', async () => {
      const result = await service.getFollowUps(mockTenantId, {});

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].petName).toBe('น้องโมจิ');
      expect(result[0].urgency).toBe('DUE_TODAY');
      expect(result[0].followUpReason).toContain('Ear Cytology');
    });
  });

  describe('getFollowUpSummary', () => {
    it('should return KPI summary of follow-ups', async () => {
      const summary = await service.getFollowUpSummary(mockTenantId);

      expect(summary).toBeDefined();
      expect(summary.dueToday).toBe(1);
      expect(summary.sentThisMonth).toBe(12);
    });
  });

  describe('sendFollowUpReminder', () => {
    it('should format message, dispatch LINE message, and record notification audit', async () => {
      const res = await service.sendFollowUpReminder(mockTenantId, mockVisitId, {
        channel: 'LINE',
      });

      expect(res.success).toBe(true);
      expect(res.channel).toBe('LINE');
      expect(lineService.pushTextMessage).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent visit', async () => {
      await expect(
        service.sendFollowUpReminder(mockTenantId, 'invalid-id', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('dismissFollowUp', () => {
    it('should clear follow-up date on visit', async () => {
      const res = await service.dismissFollowUp(mockTenantId, mockVisitId);

      expect(res.success).toBe(true);
      expect(prisma.clinicVisit.update).toHaveBeenCalledWith({
        where: { id: mockVisitId },
        data: { followUpDate: null },
      });
    });
  });
});
