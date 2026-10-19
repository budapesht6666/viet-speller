import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { avatarUrl } from './avatar-url.js';

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  async set(userId: string, image: Buffer, type: string) {
    // Prisma 7 хранит Bytes как Uint8Array: Buffer — его подкласс, но тип строже.
    const data = { image: new Uint8Array(image), type };
    const avatar = await this.prisma.avatar.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    return { avatarUrl: avatarUrl(userId, avatar) };
  }

  async remove(userId: string) {
    await this.prisma.avatar.deleteMany({ where: { userId } });
  }

  /**
   * Фото видно только своей семье. Чужому — 404, как будто фото нет: не
   * подсказываем, что такой человек существует.
   */
  async get(viewerId: string, userId: string) {
    const [viewer, owner] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: viewerId }, select: { familyId: true } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true, avatar: true } }),
    ]);
    if (!viewer || !owner?.avatar || viewer.familyId !== owner.familyId) throw new NotFoundException();
    return owner.avatar;
  }
}
