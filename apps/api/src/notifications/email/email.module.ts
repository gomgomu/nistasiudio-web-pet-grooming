import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleEmailProvider,
    SmtpEmailProvider,
    ResendEmailProvider,
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
