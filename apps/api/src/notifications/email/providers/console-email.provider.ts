import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../email.interface';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    this.logger.log(
      `[MOCK EMAIL DISPATCH] To: ${recipients} | Subject: "${options.subject}" | From: ${options.from || 'default@petflow.app'}`
    );

    return {
      success: true,
      messageId: `mock-email-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}
