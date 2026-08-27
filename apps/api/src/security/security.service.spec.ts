import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SecurityService (PF-069)', () => {
  let service: SecurityService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({
        id: 't-1',
        name: 'ทองหล่อ เพ็ท แคร์',
      }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      count: jest.fn().mockResolvedValue(5),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
  });

  describe('Password Policy & Strength Validation', () => {
    it('should reject empty or null passwords', () => {
      const res = service.validatePasswordStrength('');
      expect(res.isValid).toBe(false);
      expect(res.score).toBe(0);
    });

    it('should reject common weak dictionary passwords', () => {
      const res = service.validatePasswordStrength('password123');
      expect(res.isValid).toBe(false);
      expect(res.feedback[0]).toContain('ง่ายเกินไป');
    });

    it('should reject passwords shorter than 8 characters', () => {
      const res = service.validatePasswordStrength('P@ss1');
      expect(res.isValid).toBe(false);
      expect(res.feedback).toContain('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
    });

    it('should reject passwords without uppercase letters', () => {
      const res = service.validatePasswordStrength('p@ssw0rd123');
      expect(res.isValid).toBe(false);
      expect(res.feedback).toContain('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว');
    });

    it('should accept strong compliant passwords', () => {
      const res = service.validatePasswordStrength('PetFlow@2026Secure!');
      expect(res.isValid).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(3);
      expect(res.feedback.length).toBe(0);
    });
  });

  describe('File Upload & Path Traversal Sanitization', () => {
    it('should detect and reject directory traversal attempts', () => {
      const res = service.sanitizeFileName('../../etc/passwd');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Path Traversal');

      const resWin = service.sanitizeFileName('..\\..\\windows\\system32\\cmd.exe');
      expect(resWin.isValid).toBe(false);
    });

    it('should sanitize hazardous characters while retaining Thai and valid extensions', () => {
      const res = service.sanitizeFileName('รูปน้องโมจิ*<test>?.png');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedName).toContain('รูปน้องโมจิ');
      expect(res.sanitizedName.endsWith('.png')).toBe(true);
    });

    it('should block dangerous executable and script extensions', () => {
      const phpRes = service.validateFileMimeAndExtension('shell.php', 'application/x-php');
      expect(phpRes.isAllowed).toBe(false);
      expect(phpRes.error).toContain('ถูกห้ามอัปโหลด');

      const exeRes = service.validateFileMimeAndExtension('trojan.exe', 'application/octet-stream');
      expect(exeRes.isAllowed).toBe(false);

      const jsRes = service.validateFileMimeAndExtension('exploit.js', 'text/javascript');
      expect(jsRes.isAllowed).toBe(false);
    });

    it('should allow valid image and PDF uploads within size limits', () => {
      const res = service.validateFileMimeAndExtension(
        'vaccine_cert.pdf',
        'application/pdf',
        2 * 1024 * 1024
      );
      expect(res.isAllowed).toBe(true);
      expect(res.sanitizedFilename).toBe('vaccine_cert.pdf');
    });

    it('should reject files exceeding max size limit (15MB)', () => {
      const res = service.validateFileMimeAndExtension(
        'large_video.png',
        'image/png',
        20 * 1024 * 1024
      );
      expect(res.isAllowed).toBe(false);
      expect(res.error).toContain('เกินขีดจำกัดสูงสุด');
    });
  });

  describe('PII Masking', () => {
    it('should mask phone numbers and emails for low-privilege viewers', () => {
      const input = {
        phone: '081-999-8888',
        email: 'somchai@gmail.com',
        customerName: 'สมชาย รักสัตว์',
      };

      const masked = service.maskSensitivePii(input, 'GROOMER');
      expect(masked.phone).toBe('081-***-8888');
      expect(masked.email).toBe('s***i@gmail.com');
      expect(masked.customerName).toBe('สมชาย รักสัตว์');
    });

    it('should not mask PII for TENANT_ADMIN and TENANT_OWNER', () => {
      const input = {
        phone: '081-999-8888',
        email: 'somchai@gmail.com',
      };

      const adminView = service.maskSensitivePii(input, 'TENANT_ADMIN');
      expect(adminView.phone).toBe('081-999-8888');
      expect(adminView.email).toBe('somchai@gmail.com');
    });
  });

  describe('Webhook Signature Verification (HMAC-SHA256)', () => {
    it('should verify valid HMAC signature in constant time', () => {
      const secret = 'test-secret-key-123';
      const body = JSON.stringify({ event: 'follow', userId: 'U123456789' });
      const signature = require('crypto')
        .createHmac('sha256', secret)
        .update(Buffer.from(body))
        .digest('base64');

      const isValid = service.verifyWebhookSignature(body, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject tampered payload or invalid signature', () => {
      const secret = 'test-secret-key-123';
      const body = JSON.stringify({ event: 'follow', userId: 'U123456789' });
      const fakeSignature = 'tampered-fake-signature';

      const isValid = service.verifyWebhookSignature(body, fakeSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit and throttle when exceeded', () => {
      const ipKey = 'ip:192.168.1.100:auth';
      const limit = 3;
      const windowSec = 60;

      expect(service.checkRateLimit(ipKey, limit, windowSec).isAllowed).toBe(true);
      expect(service.checkRateLimit(ipKey, limit, windowSec).isAllowed).toBe(true);
      expect(service.checkRateLimit(ipKey, limit, windowSec).isAllowed).toBe(true);

      const throttled = service.checkRateLimit(ipKey, limit, windowSec);
      expect(throttled.isAllowed).toBe(false);
      expect(throttled.currentCount).toBe(4);
    });
  });

  describe('Security Overview', () => {
    it('should return tenant security posture report', async () => {
      const report = await service.getTenantSecurityOverview('t-1');
      expect(report.tenantId).toBe('t-1');
      expect(report.isolationStatus).toBe('ENFORCED');
      expect(report.rbacCompliance).toBe('COMPLIANT');
      expect(report.webhookSignatureEnforced).toBe(true);
      expect(report.recentSecurityEventsCount).toBe(0);
    });
  });
});
