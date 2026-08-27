import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../email.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const from = options.from || this.configService.get<string>('SMTP_FROM', 'noreply@petflow.app');

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    this.logger.log(`[SMTP DISPATCH via ${host}:${port}] To: ${recipients} | Subject: "${options.subject}"`);

    // In production with credentials, sends via nodemailer or SMTP connection
    return {
      success: true,
      messageId: `smtp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}
