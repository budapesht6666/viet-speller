import { Injectable, NotFoundException } from '@nestjs/common';
import { earned, isFamilyRule, replay } from '@viet/core';
import { achievements, item, topics } from '@viet/content';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  /**
   * Ачивки человека — тем же `earned` из ядра, что на телефоне. Семейные
   * считаются только здесь: телефон не видит чужих журналов.
   */
  async of(userId: string, now = new Date()) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!me) throw new NotFoundException();
    const members = await this.prisma.user.findMany({ where: { familyId: me.familyId }, select: { id: true } });
    const journals = new Map<string, ReturnType<typeof replay>>();
    for (const m of members) journals.set(m.id, replay(await this.progress.journal(m.id)));
    const mine = journals.get(userId)!;
    const got = earned(achievements, mine, { topics, item, now, family: [...journals.values()] });
    return {
      earned: [...got],
      family: achievements.filter((a) => isFamilyRule(a.rule) && got.has(a.id)).map((a) => a.id),
    };
  }
}
