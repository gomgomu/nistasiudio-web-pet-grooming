import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  UpdateNotificationPreferenceDto,
  QueryNotificationsDto,
} from './dto/create-notification.dto';
import {
  NotificationChannel,
  NotificationType,
} from '@petflow/types';
import { Prisma } from '@prisma/client';

export const DEFAULT_THAI_TEMPLATES = [
  {
    code: 'APPT_REMINDER_1D',
    name: 'แจ้งเตือนนัดหมายล่วงหน้า 1 วัน',
    channel: 'LINE',
    type: 'APPOINTMENT_REMINDER',
    title: 'แจ้งเตือนนัดหมายพาน้องมารับบริการ 🐾',
    content:
      'เรียนคุณ {{customerName}} พรุ่งนี้เวลา {{appointmentTime}} มีนัดหมายพาน้อง {{petName}} มารับบริการ ({{serviceName}}) ที่ {{branchName}} นะคะ หากต้องการเลื่อนนัดหมาย กรุณาติดต่อทางร้านค่ะ',
  },
  {
    code: 'GROOMING_READY_PICKUP',
    name: 'แจ้งน้องกรูมมิ่งเสร็จพร้อมรับกลับ',
    channel: 'LINE',
    type: 'GROOMING_READY',
    title: 'น้องกรูมมิ่งเสร็จเรียบร้อยแล้วค่ะ 🐶✨',
    content:
      'คุณ {{customerName}} คะ ตอนนี้น้อง {{petName}} อาบน้ำตัดขนเสร็จเรียบร้อยแล้วค่ะ พร้อมให้มารับกลับได้เลยที่ {{branchName}} ขอบคุณค่ะ',
  },
  {
    code: 'GROOMING_STATUS_UPDATE',
    name: 'อัปเดตสถานะคิวกรูมมิ่งระหว่างวัน',
    channel: 'LINE',
    type: 'GROOMING_STATUS_UPDATE',
    title: 'อัปเดตสถานะน้องกรูมมิ่ง 🛁',
    content:
      'อัปเดตสถานะน้อง {{petName}}: ขณะนี้กำลัง {{statusText}} โดยช่าง {{groomerName}} ค่ะ',
  },
  {
    code: 'VACCINE_DUE_7D',
    name: 'แจ้งเตือนกำหนดฉีดวัคซีนน้องล่วงหน้า 7 วัน',
    channel: 'LINE',
    type: 'VACCINE_REMINDER',
    title: 'แจ้งเตือนครบกำหนดฉีดวัคซีน 💉',
    content:
      'เรียนคุณ {{customerName}} น้อง {{petName}} มีกำหนดรับวัคซีน ({{vaccineName}}) ในวันที่ {{dueDate}} เพื่อภูมิคุ้มกันที่แข็งแรง สามารถจองคิวนัดหมายล่วงหน้าได้เลยค่ะ',
  },
  {
    code: 'POS_RECEIPT_SLIP',
    name: 'ส่งใบเสร็จรับเงิน e-Receipt หลังชำระเงิน',
    channel: 'LINE',
    type: 'INVOICE_RECEIPT',
    title: 'ใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Receipt) 🧾',
    content:
      'ขอบคุณคุณ {{customerName}} ที่ใช้บริการค่ะ ใบเสร็จเลขที่ {{invoiceNo}} ยอดชำระ {{totalAmount}} บาท สามารถดูสลิปฉบับเต็มได้ที่ {{receiptUrl}}',
  },
  {
    code: 'FOLLOW_UP_CARE_3D',
    name: 'ติดตามอาการหลังรับบริการ 3 วัน',
    channel: 'LINE',
    type: 'FOLLOW_UP',
    title: 'ติดตามอาการน้องหลังรับบริการ 🐾',
    content:
      'สวัสดีค่ะคุณ {{customerName}} ทางคลินิกขอสอบถามอาการของน้อง {{petName}} หลังเข้ารับการรักษา {{serviceName}} มีอาการผิดปกติหรือต้องการปรึกษาเพิ่มเติม แจ้งทางนี้ได้ตลอดนะคะ',
  },
];

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe variable interpolation replacing {{variable}} with sanitized context values
   */
  renderTemplate(templateText: string, params: Record<string, any> = {}): string {
    if (!templateText) return '';
    return templateText.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      const val = params[key];
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  /**
   * Prepares and creates a tenant-scoped notification verifying customer PDPA and communication preferences
   */
  async createNotification(tenantId: string, dto: CreateNotificationDto) {
    // 1. Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
      include: { notificationPreferences: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const channel = dto.channel || 'LINE';
    const prefs = customer.notificationPreferences;

    // 2. Validate PDPA and Notification Preferences
    if (prefs) {
      if (channel === 'LINE' && !prefs.allowLine) {
        throw new BadRequestException('Customer has opted out of LINE notifications');
      }
      if (channel === 'SMS' && !prefs.allowSms) {
        throw new BadRequestException('Customer has opted out of SMS notifications');
      }
      if (channel === 'EMAIL' && !prefs.allowEmail) {
        throw new BadRequestException('Customer has opted out of Email notifications');
      }
      if (dto.type === 'MARKETING_CAMPAIGN' && !prefs.allowMarketing) {
        throw new BadRequestException('Customer has opted out of Marketing notifications');
      }
      if (
        ['APPOINTMENT_REMINDER', 'VACCINE_REMINDER', 'FOLLOW_UP'].includes(dto.type) &&
        !prefs.allowReminders
      ) {
        throw new BadRequestException('Customer has opted out of service reminders');
      }
    }

    // 3. Resolve template if templateCode is supplied
    let title = dto.title || '';
    let message = dto.message || '';
    let payload = dto.payload || {};

    if (dto.templateCode) {
      const template = await this.prisma.notificationTemplate.findFirst({
        where: { tenantId, code: dto.templateCode, isActive: true },
      });

      if (!template) {
        throw new NotFoundException(`Notification template '${dto.templateCode}' not found`);
      }

      title = this.renderTemplate(template.title, dto.templateParams);
      message = this.renderTemplate(template.content, dto.templateParams);

      if (template.lineFlexJson) {
        payload = {
          ...payload,
          lineFlex: template.lineFlexJson,
        };
      }
    }

    if (!message) {
      throw new BadRequestException('Notification message body cannot be empty');
    }

    // 4. Create Notification record
    return this.prisma.notification.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        appointmentId: dto.appointmentId || null,
        channel,
        type: dto.type,
        status: 'PENDING',
        title,
        message,
        payload: payload as Prisma.InputJsonValue,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            lineUserId: true,
          },
        },
      },
    });
  }

  /**
   * Creates a custom notification template for the tenant
   */
  async createTemplate(tenantId: string, dto: CreateNotificationTemplateDto) {
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Template with code '${dto.code}' already exists`);
    }

    return this.prisma.notificationTemplate.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        channel: dto.channel || 'LINE',
        type: dto.type,
        title: dto.title,
        content: dto.content,
        lineFlexJson: dto.lineFlexJson ? (dto.lineFlexJson as Prisma.InputJsonValue) : Prisma.JsonNull,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Retrieves all notification templates for tenant
   */
  async findAllTemplates(
    tenantId: string,
    channel?: NotificationChannel,
    type?: NotificationType
  ) {
    return this.prisma.notificationTemplate.findMany({
      where: {
        tenantId,
        channel: channel || undefined,
        type: type || undefined,
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Updates an existing notification template
   */
  async updateTemplate(
    tenantId: string,
    id: string,
    dto: UpdateNotificationTemplateDto
  ) {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        channel: dto.channel,
        title: dto.title,
        content: dto.content,
        lineFlexJson: dto.lineFlexJson ? (dto.lineFlexJson as Prisma.InputJsonValue) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  /**
   * Gets customer communication preferences
   */
  async getCustomerPreferences(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pref = await this.prisma.notificationPreference.findFirst({
      where: { tenantId, customerId },
    });

    return (
      pref || {
        customerId,
        allowLine: true,
        allowSms: true,
        allowEmail: true,
        allowMarketing: true,
        allowReminders: true,
      }
    );
  }

  /**
   * Updates customer communication preferences
   */
  async updateCustomerPreferences(
    tenantId: string,
    customerId: string,
    dto: UpdateNotificationPreferenceDto
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.notificationPreference.upsert({
      where: { customerId },
      create: {
        tenantId,
        customerId,
        allowLine: dto.allowLine ?? true,
        allowSms: dto.allowSms ?? true,
        allowEmail: dto.allowEmail ?? true,
        allowMarketing: dto.allowMarketing ?? true,
        allowReminders: dto.allowReminders ?? true,
      },
      update: {
        allowLine: dto.allowLine,
        allowSms: dto.allowSms,
        allowEmail: dto.allowEmail,
        allowMarketing: dto.allowMarketing,
        allowReminders: dto.allowReminders,
      },
    });
  }

  /**
   * Seeds default standard Thai templates for a tenant
   */
  async seedDefaultTemplates(tenantId: string) {
    const results = [];
    for (const tpl of DEFAULT_THAI_TEMPLATES) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: { tenantId, code: tpl.code },
      });

      if (!existing) {
        const created = await this.prisma.notificationTemplate.create({
          data: {
            tenantId,
            code: tpl.code,
            name: tpl.name,
            channel: tpl.channel,
            type: tpl.type,
            title: tpl.title,
            content: tpl.content,
            isActive: true,
          },
        });
        results.push(created);
      }
    }
    return results;
  }

  /**
   * Retrieves paginated notification history
   */
  async findAllNotifications(tenantId: string, query: QueryNotificationsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      tenantId,
      customerId: query.customerId || undefined,
      channel: query.channel || undefined,
      status: query.status || undefined,
      type: query.type || undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              lineUserId: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
