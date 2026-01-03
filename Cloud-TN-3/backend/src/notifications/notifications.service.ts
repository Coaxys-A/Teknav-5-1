import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueueEmail(to: string, subject: string, body: string, userId?: number) {
    await this.prisma.notification.create({
      data: {
        userId,
        channel: 'email',
        template: subject,
        payload: { to, body },
        status: 'queued',
      },
    });
    return this.prisma.emailQueue.create({
      data: {
        to,
        subject,
        body,
        status: 'pending',
      },
    });
  }

  async createNotification(userId: number | null, title: string, body: string, linkUrl?: string, type = 'general') {
    return this.prisma.notification.create({
      data: {
        userId,
        channel: 'inapp',
        template: title,
        payload: { body, linkUrl, type },
        status: 'queued',
      },
    });
  }

  async createForRole(role: string, title: string, body: string, linkUrl?: string) {
    const users = await this.prisma.user.findMany({ where: { role: role as any } });
    for (const u of users) {
      await this.createNotification(u.id, title, body, linkUrl);
    }
  }

  async list(userId: number, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: number, userId?: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date(), status: 'read' },
    });
  }
}
