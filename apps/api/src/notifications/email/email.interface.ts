export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailSendOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  timestamp: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(options: EmailSendOptions): Promise<EmailSendResult>;
}
