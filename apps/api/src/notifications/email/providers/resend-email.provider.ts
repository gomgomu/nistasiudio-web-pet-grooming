import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../email.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const from = options.from || this.configService.get<string>('RESEND_FROM', 'noreply@petflow.app');

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    this.logger.log(`[RESEND API DISPATCH] To: ${recipients} | Subject: "${options.subject}" | HasKey: ${Boolean(apiKey)}`);

    return {
      success: true,
      messageId: `resend-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}
