import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailProvider,
  EmailSendOptions,
  EmailSendResult,
} from './email.interface';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly consoleProvider: ConsoleEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly resendProvider: ResendEmailProvider
  ) {}

  /**
   * Resolves the active email provider based on EMAIL_PROVIDER environment setting
   */
  getActiveProvider(): EmailProvider {
    const providerName = this.configService
      .get<string>('EMAIL_PROVIDER', 'console')
      .toLowerCase();

    switch (providerName) {
      case 'smtp':
        return this.smtpProvider;
      case 'resend':
        return this.resendProvider;
      case 'console':
      default:
        return this.consoleProvider;
    }
  }

  /**
   * Dispatches an email via the active provider
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult> {
    const provider = this.getActiveProvider();
    this.logger.log(`Dispatching email using provider: ${provider.name}`);
    return provider.send(options);
  }

  /**
   * Dispatches a formatted POS e-Receipt email
   */
  async sendReceiptEmail(
    to: string,
    invoiceNo: string,
    customerName: string,
    totalAmount: number,
    receiptUrl: string
  ): Promise<EmailSendResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0071e3; margin-top: 0;">ใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Receipt)</h2>
        <p>เรียนคุณ <strong>${customerName}</strong>,</p>
        <p>ขอบคุณที่ไว้วางใจใช้บริการกับทางคลินิกและกรูมมิ่งของเรา</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>เลขที่ใบเสร็จ:</strong> ${invoiceNo}</p>
          <p style="margin: 4px 0;"><strong>ยอดชำระทั้งสิ้น:</strong> ${(totalAmount / 100).toFixed(2)} บาท</p>
        </div>
        <a href="${receiptUrl}" style="display: inline-block; background-color: #0071e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">ดูใบเสร็จฉบับเต็ม</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">PetFlow SaaS — ระบบบริหารจัดการคลินิกและกรูมมิ่งสัตว์เลี้ยง</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `ใบเสร็จรับเงิน ${invoiceNo} — PetFlow`,
      html,
      text: `ใบเสร็จรับเงิน ${invoiceNo} ยอดชำระ ${(totalAmount / 100).toFixed(2)} บาท ดูสลิปได้ที่: ${receiptUrl}`,
    });
  }

  /**
   * Dispatches a formatted appointment reminder email
   */
  async sendAppointmentReminderEmail(
    to: string,
    customerName: string,
    petName: string,
    appointmentTime: string,
    branchName: string
  ): Promise<EmailSendResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0071e3; margin-top: 0;">แจ้งเตือนนัดหมายบริการ 🐾</h2>
        <p>เรียนคุณ <strong>${customerName}</strong>,</p>
        <p>ขอแจ้งเตือนนัดหมายพาน้อง <strong>${petName}</strong> มารับบริการที่ <strong>${branchName}</strong> ในวันและเวลา:</p>
        <div style="background-color: #eff6ff; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #bfdbfe;">
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e40af;">📅 ${appointmentTime}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">หากต้องการเลื่อนหรือยกเลิกนัดหมาย กรุณาติดต่อทางร้านล่วงหน้าอย่างน้อย 2 ชั่วโมงค่ะ</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `เตือนนัดหมายน้อง ${petName} — ${branchName}`,
      html,
      text: `เตือนนัดหมายพาน้อง ${petName} มารับบริการที่ ${branchName} เวลา ${appointmentTime}`,
    });
  }
}
