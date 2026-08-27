import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from '../line/line.service';
import { QueueService } from '../notifications/queues/queue.service';
import { QueryFollowUpsDto } from './dto/query-follow-ups.dto';
import { SendFollowUpReminderDto } from './dto/send-follow-up-reminder.dto';
import {
  ClinicalFollowUpItem,
  FollowUpSummary,
} from '@petflow/types';

@Injectable()
export class FollowUpRemindersService {
  private readonly logger = new Logger(FollowUpRemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly queueService: QueueService
  ) {}

  /**
   * Get list of clinical follow-ups and recheck opportunities
   */
  async getFollowUps(
    tenantId: string,
    query: QueryFollowUpsDto
  ): Promise<ClinicalFollowUpItem[]> {
    const daysAhead = query.daysAhead ?? 14;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    const maxDate = new Date(todayDate);
    maxDate.setDate(maxDate.getDate() + daysAhead);

    const where: any = {
      tenantId,
      followUpDate: {
        not: null,
      },
    };

    if (query.veterinarianId) {
      where.veterinarianId = query.veterinarianId;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    const visits = await this.prisma.clinicVisit.findMany({
      where,
      include: {
        pet: {
          include: { customer: true },
        },
        customer: true,
        veterinarian: true,
        branch: true,
      },
      orderBy: { followUpDate: 'asc' },
    });

    const items: ClinicalFollowUpItem[] = [];

    for (const v of visits) {
      if (!v.followUpDate) continue;

      const fDateStr = v.followUpDate.toISOString().split('T')[0];
      const fDate = new Date(fDateStr);
      const diffTime = fDate.getTime() - todayDate.getTime();
      const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let urgency: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' = 'UPCOMING';
      if (daysUntilDue < 0) {
        urgency = 'OVERDUE';
      } else if (daysUntilDue === 0) {
        urgency = 'DUE_TODAY';
      }

      // Check if matches urgency filter
      if (query.urgency && query.urgency !== 'ALL' && urgency !== query.urgency) {
        continue;
      }

      // Check search query
      if (query.search) {
        const s = query.search.toLowerCase().trim();
        const match =
          v.pet.name.toLowerCase().includes(s) ||
          v.customer.firstName.toLowerCase().includes(s) ||
          v.customer.lastName.toLowerCase().includes(s) ||
          v.customer.phone.includes(s) ||
          (v.followUpReason && v.followUpReason.toLowerCase().includes(s)) ||
          (v.diagnosis && v.diagnosis.toLowerCase().includes(s));
        if (!match) continue;
      }

      // Find any previous reminder notification
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          tenantId,
          customerId: v.customerId,
          type: 'FOLLOW_UP_REMINDER',
        },
        orderBy: { createdAt: 'desc' },
      });

      const reminderStatus = existingNotification ? 'SENT' : 'PENDING';

      items.push({
        id: `fu-${v.id}`,
        tenantId: v.tenantId,
        visitId: v.id,
        visitNumber: v.visitNumber || null,
        petId: v.petId,
        petName: v.pet.name,
        species: v.pet.species,
        breed: v.pet.breed || null,
        customerId: v.customerId,
        customerName: `${v.customer.firstName} ${v.customer.lastName}`,
        customerPhone: v.customer.phone,
        lineUserId: v.customer.lineUserId || null,
        veterinarianId: v.veterinarianId || null,
        veterinarianName: v.veterinarian
          ? `${v.veterinarian.firstName} ${v.veterinarian.lastName}`
          : null,
        followUpDate: fDateStr,
        followUpReason: v.followUpReason || 'นัดตรวจติดตามอาการ (Follow-up)',
        diagnosis: v.diagnosis || null,
        daysUntilDue,
        urgency,
        reminderStatus,
        lastReminderSentAt: existingNotification
          ? existingNotification.createdAt.toISOString()
          : null,
      });
    }

    // Sort: OVERDUE first (most overdue top), then DUE_TODAY, then UPCOMING
    return items.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }

  /**
   * Get Follow-up KPI Summary
   */
  async getFollowUpSummary(tenantId: string): Promise<FollowUpSummary> {
    const all = await this.getFollowUps(tenantId, { daysAhead: 30, urgency: 'ALL' });

    const dueToday = all.filter((i) => i.urgency === 'DUE_TODAY').length;
    const overdue = all.filter((i) => i.urgency === 'OVERDUE').length;
    const upcoming7Days = all.filter(
      (i) => i.urgency === 'UPCOMING' && i.daysUntilDue <= 7
    ).length;
    const totalPending = all.filter((i) => i.reminderStatus === 'PENDING').length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sentThisMonth = await this.prisma.notification.count({
      where: {
        tenantId,
        type: 'FOLLOW_UP_REMINDER',
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      totalPending,
      dueToday,
      overdue,
      upcoming7Days,
      sentThisMonth,
    };
  }

  /**
   * Send 1-Click Follow-up reminder via LINE or SMS
   */
  async sendFollowUpReminder(
    tenantId: string,
    visitId: string,
    dto: SendFollowUpReminderDto
  ): Promise<{
    success: boolean;
    channel: string;
    recipientPhone: string;
    messageText: string;
    sentAt: string;
  }> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
      include: {
        pet: true,
        customer: true,
        veterinarian: true,
        branch: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    if (!visit.followUpDate) {
      throw new BadRequestException('This clinic visit does not have a scheduled follow-up date');
    }

    const fDateStr = new Date(visit.followUpDate).toLocaleDateString('th-TH', {
      dateStyle: 'medium',
    });
    const petName = visit.pet.name;
    const vetName = visit.veterinarian
      ? `${visit.veterinarian.firstName} ${visit.veterinarian.lastName}`
      : 'สัตวแพทย์';
    const clinicName = visit.branch.name || 'คลินิก';
    const clinicPhone = visit.branch.phone || '';
    const reason = visit.followUpReason || 'ตรวจติดตามอาการ';

    const defaultMessage = `🐾 [แจ้งเตือนนัดตรวจติดตามอาการ - ${clinicName}]\n\nเรียน คุณ${visit.customer.firstName}\nคลินิกขอแจ้งเตือนวันนัดตรวจซ้ำของ ${petName}\n\n📅 กำหนดนัด: วันที่ ${fDateStr}\n🩺 เหตุผล: ${reason}\n👨‍⚕️ สัตวแพทย์: ${vetName}\n\nหากท่านต้องการยืนยันเวลานัดหมายหรือเลื่อนนัด กรุณาตอบกลับข้อความนี้ หรือโทร ${clinicPhone}\nขอบคุณที่ไว้วางใจให้เราดูแล ${petName} ครับ 💙`;

    const messageText = dto.customMessage || defaultMessage;
    const channel = dto.channel || (visit.customer.lineUserId ? 'LINE' : 'SMS');

    // If LINE User ID is connected, dispatch LINE message
    if (channel === 'LINE' && visit.customer.lineUserId) {
      try {
        await this.lineService.pushTextMessage(
          tenantId,
          visit.customer.lineUserId,
          messageText
        );
      } catch (err) {
        this.logger.warn(`Failed to send LINE message to ${visit.customer.lineUserId}: ${err}`);
      }
    }

    // Save notification audit record
    await this.prisma.notification.create({
      data: {
        tenantId,
        customerId: visit.customerId,
        channel: channel === 'LINE' ? 'LINE' : 'SMS',
        type: 'FOLLOW_UP_REMINDER',
        title: `แจ้งเตือนนัดติดตามอาการ: ${petName}`,
        message: messageText,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      channel,
      recipientPhone: visit.customer.phone,
      messageText,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Dismiss or complete follow-up
   */
  async dismissFollowUp(
    tenantId: string,
    visitId: string
  ): Promise<{ success: boolean }> {
    const visit = await this.prisma.clinicVisit.findFirst({
      where: { id: visitId, tenantId },
    });

    if (!visit) {
      throw new NotFoundException('Clinic visit not found');
    }

    await this.prisma.clinicVisit.update({
      where: { id: visitId },
      data: {
        followUpDate: null,
      },
    });

    return { success: true };
  }
}
