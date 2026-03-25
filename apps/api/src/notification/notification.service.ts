import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '@org/shared-types';

export interface CreateNotificationDto {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      organizationId: dto.organizationId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      link: dto.link ?? null,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string, organizationId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, organizationId, read: false },
      { read: true },
    );
  }

  async getUnreadCount(
    userId: string,
    organizationId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, organizationId, read: false },
    });
    return { count };
  }
}
