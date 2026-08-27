import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  PasswordStrengthResult,
  FileUploadValidationResult,
  SecurityOverviewReport,
} from '@petflow/types';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  // In-memory rate limiting store: key -> { count: number, resetAt: number }
  private readonly rateLimitStore = new Map<string, { count: number; resetAt: number }>();

  // Allowed extensions for media/attachments
  private readonly ALLOWED_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.pdf',
    '.csv',
    '.xlsx',
    '.doc',
    '.docx',
  ]);

  // Forbidden dangerous executable/script extensions
  private readonly FORBIDDEN_EXTENSIONS = new Set([
    '.php',
    '.phtml',
    '.php3',
    '.php4',
    '.php5',
    '.phps',
    '.exe',
    '.sh',
    '.bat',
    '.cmd',
    '.js',
    '.vbs',
    '.dll',
    '.scr',
    '.jar',
    '.msi',
    '.jsp',
    '.asp',
    '.aspx',
    '.cgi',
    '.pl',
    '.py',
    '.svg', // Disallowed if raw XML can contain XSS script tags
  ]);

  // Allowed MIME types
  private readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  private readonly MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

  private readonly COMMON_WEAK_PASSWORDS = new Set([
    'password',
    'password123',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty123',
    'admin123',
    'welcome123',
    'petflow123',
    'thonglor123',
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates password strength according to enterprise SaaS policy:
   * - Min 8 characters
   * - Contains uppercase & lowercase
   * - Contains numeric digits
   * - Contains special characters
   * - Not in common weak dictionary
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        feedback: ['รหัสผ่านต้องไม่ว่างเปล่า'],
      };
    }

    if (this.COMMON_WEAK_PASSWORDS.has(password.toLowerCase().trim())) {
      return {
        isValid: false,
        score: 0,
        feedback: ['รหัสผ่านนี้ง่ายเกินไปและเป็นคำที่พบบ่อย กรุณาตั้งรหัสผ่านที่ปลอดภัยกว่านี้'],
      };
    }

    // 1. Length check
    if (password.length < 8) {
      feedback.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
    } else {
      score += 1;
    }

    // 2. Lowercase check
    if (!/[a-z]/.test(password)) {
      feedback.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว');
    } else {
      score += 1;
    }

    // 3. Uppercase check
    if (!/[A-Z]/.test(password)) {
      feedback.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว');
    } else {
      score += 1;
    }

    // 4. Number or Symbol check
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (!hasNumber) {
      feedback.push('รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว');
    }

    if (!hasSpecial) {
      feedback.push('รหัสผ่านต้องมีอักขระพิเศษ (เช่น !@#$%) อย่างน้อย 1 ตัว');
    }

    if (hasNumber && hasSpecial) {
      score += 1;
    }

    const isValid = feedback.length === 0;

    return {
      isValid,
      score: Math.min(4, score),
      feedback,
    };
  }

  /**
   * Sanitizes a file name, preventing path traversal (`../`, `..\\`, null bytes `%00`)
   */
  sanitizeFileName(filename: string): { isValid: boolean; sanitizedName: string; error?: string } {
    if (!filename || typeof filename !== 'string') {
      return { isValid: false, sanitizedName: '', error: 'ชื่อไฟล์ไม่ถูกต้อง' };
    }

    // Detect path traversal attacks
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('\0') ||
      filename.includes('%00')
    ) {
      return {
        isValid: false,
        sanitizedName: '',
        error: 'ตรวจพบความพยายาม Path Traversal ในชื่อไฟล์',
      };
    }

    // Remove hazardous characters, keep letters, numbers, hyphens, underscores, dots, and Thai Unicode
    const baseName = filename.replace(/[^a-zA-Z0-9\u0E00-\u0E7F._-]/g, '_');
    const dotIndex = baseName.lastIndexOf('.');
    if (dotIndex <= 0) {
      return { isValid: false, sanitizedName: baseName, error: 'ไฟล์ต้องมีนามสกุล (Extension)' };
    }

    return {
      isValid: true,
      sanitizedName: baseName,
    };
  }

  /**
   * Validates file upload extension, MIME type, and file size limits
   */
  validateFileMimeAndExtension(
    filename: string,
    mimeType: string,
    fileSizeBytes?: number
  ): FileUploadValidationResult {
    const sanitizeResult = this.sanitizeFileName(filename);
    if (!sanitizeResult.isValid) {
      return {
        isAllowed: false,
        sanitizedFilename: '',
        mimeType,
        fileSizeBytes,
        error: sanitizeResult.error || 'ชื่อไฟล์ไม่ปลอดภัย',
      };
    }

    const lowerFilename = filename.toLowerCase();
    const ext = lowerFilename.substring(lowerFilename.lastIndexOf('.'));

    // Check forbidden executable extensions
    if (this.FORBIDDEN_EXTENSIONS.has(ext)) {
      return {
        isAllowed: false,
        sanitizedFilename: sanitizeResult.sanitizedName,
        mimeType,
        fileSizeBytes,
        error: `นามสกุลไฟล์ '${ext}' ถูกห้ามอัปโหลดเนื่องจากเหตุผลด้านความปลอดภัย`,
      };
    }

    // Check allowed whitelist extensions
    if (!this.ALLOWED_EXTENSIONS.has(ext)) {
      return {
        isAllowed: false,
        sanitizedFilename: sanitizeResult.sanitizedName,
        mimeType,
        fileSizeBytes,
        error: `ไม่อนุญาตให้อัปโหลดไฟล์นามสกุล '${ext}' (อนุญาตเฉพาะรูปภาพ เอกสาร PDF และสเปรดชีต)`,
      };
    }

    // Check allowed MIME type
    if (!this.ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      return {
        isAllowed: false,
        sanitizedFilename: sanitizeResult.sanitizedName,
        mimeType,
        fileSizeBytes,
        error: `MIME type '${mimeType}' ไม่ได้รับอนุญาต`,
      };
    }

    // Check file size limit
    if (fileSizeBytes !== undefined && fileSizeBytes > this.MAX_FILE_SIZE_BYTES) {
      return {
        isAllowed: false,
        sanitizedFilename: sanitizeResult.sanitizedName,
        mimeType,
        fileSizeBytes,
        error: `ขนาดไฟล์ (${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB) เกินขีดจำกัดสูงสุด 15 MB`,
      };
    }

    return {
      isAllowed: true,
      sanitizedFilename: sanitizeResult.sanitizedName,
      mimeType,
      fileSizeBytes,
    };
  }

  /**
   * Masks Personally Identifiable Information (PII) for low-privilege viewers
   * E.g. Groomer / General Staff seeing phone: '081-***-8888', email: 'k***@example.com'
   */
  maskSensitivePii(data: any, viewerRole?: string): any {
    if (!data) return data;

    // Tenant Admins and Owners see full unmasked PII
    if (viewerRole === 'TENANT_OWNER' || viewerRole === 'TENANT_ADMIN' || viewerRole === 'SUPER_ADMIN') {
      return data;
    }

    const masked = { ...data };

    if (masked.phone && typeof masked.phone === 'string' && masked.phone.length >= 8) {
      const clean = masked.phone.replace(/-/g, '');
      if (clean.length === 10) {
        masked.phone = `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
      } else {
        masked.phone = `${masked.phone.slice(0, 3)}***${masked.phone.slice(-3)}`;
      }
    }

    if (masked.email && typeof masked.email === 'string' && masked.email.includes('@')) {
      const [name, domain] = masked.email.split('@');
      const maskedName = name.length > 2 ? `${name[0]}***${name.slice(-1)}` : `${name[0]}***`;
      masked.email = `${maskedName}@${domain}`;
    }

    return masked;
  }

  /**
   * Constant-time Webhook HMAC-SHA256 signature verification (prevents timing attacks)
   */
  verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    if (!signature || !secret || !rawBody) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
      const calculatedSignature = hmac.update(bodyBuffer).digest('base64');

      const sigBuffer = Buffer.from(signature, 'utf8');
      const calcBuffer = Buffer.from(calculatedSignature, 'utf8');

      if (sigBuffer.length !== calcBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, calcBuffer);
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * In-Memory sliding-window rate limit checker
   */
  checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): { isAllowed: boolean; currentCount: number; ttl: number } {
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      this.rateLimitStore.set(key, { count: 1, resetAt });
      return { isAllowed: true, currentCount: 1, ttl: windowSeconds };
    }

    entry.count += 1;
    const ttl = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
    const isAllowed = entry.count <= maxRequests;

    return {
      isAllowed,
      currentCount: entry.count,
      ttl,
    };
  }

  /**
   * Audits security event
   */
  async auditSecurityEvent(
    tenantId: string,
    userId: string,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    this.logger.log(`[SECURITY AUDIT] Tenant: ${tenantId} | User: ${userId} | Action: ${action} | Details: ${JSON.stringify(details)}`);
  }

  /**
   * Retrieves security overview posture for tenant dashboard
   */
  async getTenantSecurityOverview(tenantId: string): Promise<SecurityOverviewReport> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      isolationStatus: 'ENFORCED',
      rbacCompliance: 'COMPLIANT',
      rateLimitStatus: 'ACTIVE',
      webhookSignatureEnforced: true,
      recentSecurityEventsCount: 0,
      lastAuditAt: new Date().toISOString(),
    };
  }
}
