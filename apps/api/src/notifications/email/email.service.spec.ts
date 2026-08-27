import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';

describe('EmailService (PF-046)', () => {
  let service: EmailService;
  let configService: any;
  let consoleProvider: ConsoleEmailProvider;
  let smtpProvider: SmtpEmailProvider;
  let resendProvider: ResendEmailProvider;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string, defaultVal?: any) => {
        if (key === 'EMAIL_PROVIDER') return defaultVal || 'console';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        ConsoleEmailProvider,
        SmtpEmailProvider,
        ResendEmailProvider,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    consoleProvider = module.get<ConsoleEmailProvider>(ConsoleEmailProvider);
    smtpProvider = module.get<SmtpEmailProvider>(SmtpEmailProvider);
    resendProvider = module.get<ResendEmailProvider>(ResendEmailProvider);
  });

  describe('getActiveProvider', () => {
    it('returns ConsoleEmailProvider by default', () => {
      configService.get.mockReturnValue('console');
      const provider = service.getActiveProvider();
      expect(provider.name).toBe('console');
    });

    it('returns SmtpEmailProvider when EMAIL_PROVIDER=smtp', () => {
      configService.get.mockReturnValue('smtp');
      const provider = service.getActiveProvider();
      expect(provider.name).toBe('smtp');
    });

    it('returns ResendEmailProvider when EMAIL_PROVIDER=resend', () => {
      configService.get.mockReturnValue('resend');
      const provider = service.getActiveProvider();
      expect(provider.name).toBe('resend');
    });
  });

  describe('sendEmail', () => {
    it('dispatches email and returns success result with messageId', async () => {
      const result = await service.sendEmail({
        to: 'customer@example.com',
        subject: 'ยินดีต้อนรับสู่ PetFlow',
        html: '<p>สวัสดีครับ</p>',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('console');
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendReceiptEmail', () => {
    it('formats and dispatches e-Receipt email with amount and link', async () => {
      const result = await service.sendReceiptEmail(
        'customer@example.com',
        'INV-202608-0008',
        'คุณสุภาพร',
        85600, // 856.00 THB
        'https://app.petflow.th/pos/receipt/INV-202608-0008'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('sendAppointmentReminderEmail', () => {
    it('formats and dispatches appointment reminder email', async () => {
      const result = await service.sendAppointmentReminderEmail(
        'customer@example.com',
        'คุณสุภาพร',
        'น้องโมจิ',
        'พรุ่งนี้ 14:00 น.',
        'สาขาทองหล่อ'
      );

      expect(result.success).toBe(true);
    });
  });
});
