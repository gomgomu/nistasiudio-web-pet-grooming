import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

describe('BackupService', () => {
  let service: BackupService;
  let prisma: PrismaService;
  const mockTenantId = '11111111-1111-1111-1111-111111111111';

  const mockPrisma = {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerBackup', () => {
    it('should create a backup file, sha256 checksum, and metadata file', async () => {
      const result = await service.triggerBackup({ customPrefix: 'test_backup' }, 'admin-123');

      expect(result).toBeDefined();
      expect(result.filename).toContain('test_backup');
      expect(result.sha256).toBeDefined();
      expect(result.verified).toBe(true);

      const backupDir = path.resolve(process.cwd(), 'backups');
      const targetFile = path.join(backupDir, result.filename);
      expect(fs.existsSync(targetFile)).toBe(true);

      // Clean up test file
      try {
        fs.unlinkSync(targetFile);
        fs.unlinkSync(targetFile.replace(/\.sql$/, '.meta.json'));
      } catch {}
    });
  });

  describe('getBackupHistory', () => {
    it('should return a list of backup archives', async () => {
      const history = await service.getBackupHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('verifyBackupIntegrity', () => {
    it('should verify sha256 integrity for existing backup', async () => {
      const backup = await service.triggerBackup({ customPrefix: 'verify_test' });
      const verifyResult = await service.verifyBackupIntegrity(backup.filename);

      expect(verifyResult.filename).toBe(backup.filename);
      expect(verifyResult.verified).toBe(true);
      expect(verifyResult.sha256).toBe(backup.sha256);

      // Clean up
      const backupDir = path.resolve(process.cwd(), 'backups');
      try {
        fs.unlinkSync(path.join(backupDir, backup.filename));
        fs.unlinkSync(path.join(backupDir, backup.filename.replace(/\.sql$/, '.meta.json')));
      } catch {}
    });

    it('should throw NotFoundException if backup file does not exist', async () => {
      await expect(service.verifyBackupIntegrity('non-existent-backup.sql')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('exportTenantData', () => {
    it('should export all tenant data in structured format', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        name: 'Happy Paws Grooming',
        branches: [{ id: 'branch-1' }],
        customers: [{ id: 'cust-1', pets: [{ id: 'pet-1' }] }],
        services: [],
        appointments: [],
        groomingQueueItems: [],
        invoices: [],
        products: [],
      });

      const exportResult = await service.exportTenantData(mockTenantId, 'admin-123');

      expect(exportResult.tenantId).toBe(mockTenantId);
      expect(exportResult.tenantName).toBe('Happy Paws Grooming');
      expect((exportResult.data as any).customers.length).toBe(1);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.exportTenantData('unknown-tenant')).rejects.toThrow(NotFoundException);
    });
  });
});
