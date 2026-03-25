import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnnouncementPriority, NotificationType } from '@org/shared-types';
import { In, Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { Employee } from '../employee/entities/employee.entity';
import { NotificationService } from '../notification/notification.service';

function mapAuthor(user: User) {
  return { firstName: user.firstName, lastName: user.lastName };
}

function mapAnnouncement(a: Announcement) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    imageUrls: Array.isArray(a.imageUrls) ? a.imageUrls : [],
    priority: a.priority,
    authorId: a.authorId,
    author: a.author ? mapAuthor(a.author) : undefined,
    organizationId: a.organizationId,
    expiresAt: a.expiresAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    readCount: a.readCount,
  };
}

function mapAnnouncementAdmin(a: Announcement) {
  return {
    ...mapAnnouncement(a),
    targetUserIds: a.targetUsers?.map((u) => u.id) ?? [],
    targetDepartmentIds: a.targetDepartments?.map((d) => d.id) ?? [],
    targetUsers:
      a.targetUsers?.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
      })) ?? [],
    targetDepartments:
      a.targetDepartments?.map((d) => ({
        id: d.id,
        name: d.name,
      })) ?? [],
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trunc(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepo: Repository<AnnouncementRead>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly notificationService: NotificationService,
  ) {}

  private isVisibleToUser(
    a: Announcement,
    userId: string,
    userDepartmentId: string | null,
  ): boolean {
    const nu = a.targetUsers?.length ?? 0;
    const nd = a.targetDepartments?.length ?? 0;
    if (nu === 0 && nd === 0) return true;
    if (a.targetUsers?.some((u) => u.id === userId)) return true;
    if (
      userDepartmentId &&
      a.targetDepartments?.some((d) => d.id === userDepartmentId)
    ) {
      return true;
    }
    return false;
  }

  private async getEmployeeDepartmentId(
    userId: string,
    organizationId: string,
  ): Promise<string | null> {
    const emp = await this.employeeRepo.findOne({
      where: { userId, organizationId },
      select: ['departmentId'],
    });
    return emp?.departmentId ?? null;
  }

  private async filterUnread(
    announcements: Announcement[],
    userId: string,
  ): Promise<Announcement[]> {
    if (announcements.length === 0) return [];
    const ids = announcements.map((a) => a.id);
    const reads = await this.readRepo.find({
      where: { userId, announcementId: In(ids) },
      select: ['announcementId'],
    });
    const readSet = new Set(reads.map((r) => r.announcementId));
    return announcements.filter((a) => !readSet.has(a.id));
  }

  async findAll(userId: string, organizationId: string) {
    const now = new Date();
    const deptId = await this.getEmployeeDepartmentId(userId, organizationId);
    const rows = await this.announcementRepo.find({
      where: { organizationId },
      relations: ['author', 'targetUsers', 'targetDepartments'],
      order: { createdAt: 'DESC' },
    });
    const visible = rows.filter((a) =>
      this.isVisibleToUser(a, userId, deptId),
    );
    const active = visible.filter(
      (a) => !a.expiresAt || a.expiresAt >= now,
    );
    const unread = await this.filterUnread(active, userId);
    return unread.map((a) => mapAnnouncement(a));
  }

  async findAllForAdmin(organizationId: string) {
    const rows = await this.announcementRepo.find({
      where: { organizationId },
      relations: ['author', 'targetUsers', 'targetDepartments'],
      order: { createdAt: 'DESC' },
    });
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const countsRaw = await this.readRepo
      .createQueryBuilder('r')
      .select('r.announcementId', 'aid')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.announcementId IN (:...ids)', { ids })
      .groupBy('r.announcementId')
      .getRawMany()
      .catch(() => [] as { aid: string; cnt: string }[]);
    const countMap = new Map(
      countsRaw.map((r) => [r.aid, parseInt(r.cnt, 10)]),
    );
    return rows.map((a) => ({
      ...mapAnnouncementAdmin(a),
      readCount: countMap.get(a.id) ?? 0,
    }));
  }

  async findFeed(userId: string, organizationId: string) {
    const now = new Date();
    const deptId = await this.getEmployeeDepartmentId(userId, organizationId);
    const rows = await this.announcementRepo.find({
      where: { organizationId },
      relations: ['author', 'targetUsers', 'targetDepartments'],
      order: { createdAt: 'DESC' },
    });
    const active = rows.filter(
      (a) => !a.expiresAt || a.expiresAt >= now,
    );
    const visible = active.filter((a) =>
      this.isVisibleToUser(a, userId, deptId),
    );
    if (visible.length === 0) {
      return [];
    }
    const reads = await this.readRepo.find({
      where: {
        userId,
        announcementId: In(visible.map((a) => a.id)),
      },
      select: ['announcementId'],
    });
    const readSet = new Set(reads.map((r) => r.announcementId));
    return visible.map((a) => ({
      ...mapAnnouncement(a),
      readByMe: readSet.has(a.id),
    }));
  }

  async create(
    organizationId: string,
    authorId: string,
    dto: CreateAnnouncementDto,
  ) {
    const expiresAt =
      dto.expiresAt != null && dto.expiresAt !== ''
        ? new Date(dto.expiresAt)
        : null;

    const entity = this.announcementRepo.create({
      title: dto.title,
      content: dto.content,
      priority: dto.priority ?? AnnouncementPriority.NORMAL,
      authorId,
      organizationId,
      expiresAt,
      imageUrls: dto.imageUrls ?? [],
    });
    const saved = await this.announcementRepo.save(entity);
    await this.applyTargets(
      saved,
      organizationId,
      dto.targetUserIds,
      dto.targetDepartmentIds,
    );
    const full = await this.announcementRepo.findOne({
      where: { id: saved.id },
      relations: ['author', 'targetUsers', 'targetDepartments'],
    });
    if (!full) {
      return mapAnnouncementAdmin(saved as Announcement);
    }
    await this.notifyOrganizationOfAnnouncement(
      organizationId,
      authorId,
      full,
    );
    return mapAnnouncementAdmin(full);
  }

  private async applyTargets(
    announcement: Announcement,
    organizationId: string,
    targetUserIds?: string[],
    targetDepartmentIds?: string[],
  ) {
    const uids = targetUserIds ?? [];
    const dids = targetDepartmentIds ?? [];

    if (uids.length) {
      const users = await this.userRepo.find({
        where: { id: In(uids), organizationId },
      });
      if (users.length !== uids.length) {
        throw new BadRequestException(
          'One or more selected users are invalid for this organization',
        );
      }
    }

    if (dids.length) {
      const depts = await this.departmentRepo
        .createQueryBuilder('d')
        .where('d.organization_id = :orgId', { orgId: organizationId })
        .andWhere('d.id IN (:...ids)', { ids: dids })
        .getMany();
      if (depts.length !== dids.length) {
        throw new BadRequestException(
          'One or more selected departments are invalid for this organization',
        );
      }
    }

    const annId = announcement.id;
    await this.announcementRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Announcement);
      const sync = async (
        rel: 'targetUsers' | 'targetDepartments',
        ids: string[],
      ) => {
        const existing = await repo
          .createQueryBuilder()
          .relation(Announcement, rel)
          .of(annId)
          .loadMany();
        const existingIds = (existing as { id: string }[]).map((e) => e.id);
        if (existingIds.length) {
          await repo
            .createQueryBuilder()
            .relation(Announcement, rel)
            .of(annId)
            .remove(existingIds);
        }
        if (ids.length) {
          await repo
            .createQueryBuilder()
            .relation(Announcement, rel)
            .of(annId)
            .add(ids);
        }
      };
      await sync('targetUsers', uids);
      await sync('targetDepartments', dids);
    });
  }

  private async notifyOrganizationOfAnnouncement(
    organizationId: string,
    authorId: string,
    announcement: Announcement,
  ) {
    const recipientIds = await this.resolveRecipientUserIds(
      organizationId,
      authorId,
      announcement,
    );
    const title = trunc(announcement.title, 255);
    const preview = trunc(stripHtml(announcement.content), 500);
    const message =
      preview.length > 0
        ? preview
        : 'A new announcement was posted in your organization.';
    const link = '/announcements';

    await Promise.all(
      recipientIds.map((userId) =>
        this.notificationService.create({
          userId,
          organizationId,
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          title,
          message,
          link,
        }),
      ),
    );
  }

  private async resolveRecipientUserIds(
    organizationId: string,
    authorId: string,
    announcement: Announcement,
  ): Promise<string[]> {
    const nu = announcement.targetUsers?.length ?? 0;
    const nd = announcement.targetDepartments?.length ?? 0;
    if (nu === 0 && nd === 0) {
      const all = await this.userRepo.find({
        where: { organizationId, isActive: true },
        select: ['id'],
      });
      return all.map((u) => u.id).filter((id) => id !== authorId);
    }
    const set = new Set<string>();
    if (nu > 0 && announcement.targetUsers) {
      for (const u of announcement.targetUsers) set.add(u.id);
    }
    if (nd > 0 && announcement.targetDepartments) {
      const deptIds = announcement.targetDepartments.map((d) => d.id);
      const emps = await this.employeeRepo.find({
        where: { organizationId, departmentId: In(deptIds) },
        select: ['userId'],
      });
      for (const e of emps) set.add(e.userId);
    }
    set.delete(authorId);
    return [...set];
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateAnnouncementDto,
  ) {
    const found = await this.announcementRepo.findOne({
      where: { id, organizationId },
      relations: ['author', 'targetUsers', 'targetDepartments'],
    });
    if (!found) {
      throw new NotFoundException('Announcement not found');
    }
    if (dto.title !== undefined) found.title = dto.title;
    if (dto.content !== undefined) found.content = dto.content;
    if (dto.priority !== undefined) found.priority = dto.priority;
    if (dto.expiresAt !== undefined) {
      found.expiresAt =
        dto.expiresAt != null && dto.expiresAt !== ''
          ? new Date(dto.expiresAt)
          : null;
    }
    if (dto.imageUrls !== undefined) {
      found.imageUrls = dto.imageUrls ?? [];
    }
    await this.announcementRepo.save(found);
    if (
      dto.targetUserIds !== undefined ||
      dto.targetDepartmentIds !== undefined
    ) {
      const uids =
        dto.targetUserIds !== undefined
          ? dto.targetUserIds
          : found.targetUsers?.map((u) => u.id) ?? [];
      const dids =
        dto.targetDepartmentIds !== undefined
          ? dto.targetDepartmentIds
          : found.targetDepartments?.map((d) => d.id) ?? [];
      await this.applyTargets(found, organizationId, uids, dids);
    }
    const reloaded = await this.announcementRepo.findOne({
      where: { id: found.id, organizationId },
      relations: ['author', 'targetUsers', 'targetDepartments'],
    });
    if (!reloaded) {
      throw new NotFoundException('Announcement not found');
    }
    return mapAnnouncementAdmin(reloaded);
  }

  async remove(organizationId: string, id: string) {
    const found = await this.announcementRepo.findOne({
      where: { id, organizationId },
    });
    if (!found) {
      throw new NotFoundException('Announcement not found');
    }
    await this.announcementRepo.softDelete({ id, organizationId });
  }

  async markAsRead(
    announcementId: string,
    userId: string,
    organizationId: string,
  ) {
    const ann = await this.announcementRepo.findOne({
      where: { id: announcementId, organizationId },
      relations: ['targetUsers', 'targetDepartments'],
    });
    if (!ann) {
      throw new NotFoundException('Announcement not found');
    }
    const deptId = await this.getEmployeeDepartmentId(userId, organizationId);
    if (!this.isVisibleToUser(ann, userId, deptId)) {
      throw new NotFoundException('Announcement not found');
    }
    const existing = await this.readRepo.findOne({
      where: { announcementId, userId },
    });
    if (existing) {
      return { success: true as const };
    }
    await this.readRepo.save(
      this.readRepo.create({ announcementId, userId }),
    );
    return { success: true as const };
  }
}
