import { Injectable, NotFoundException } from '@nestjs/common';
import { dayKey, minutesOn, minutesThisWeek, replay, streak, weekStart } from '@viet/core';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProgressService } from '../progress/progress.service.js';
import { avatarUrl } from '../avatars/avatar-url.js';

export interface Standing {
  userId: string;
  name: string;
  /** Фото профиля или null — тогда буква имени. */
  avatarUrl: string | null;
  /** Минуты практики за текущую неделю (с понедельника, по Вьетнаму). */
  weekMinutes: number;
  todayMinutes: number;
  streak: number;
  lessonsDone: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressService,
  ) {}

  /**
   * Рейтинг семьи за неделю — по минутам, а не по очкам (PLAN.md, этап 8):
   * очки выгоднее набирать лёгкими уроками, минуты — нет.
   *
   * Считается из журналов тем же replay, что на телефоне: цифра в рейтинге
   * совпадает с цифрой на главной у самого человека.
   */
  async ofFamily(userId: string, now = new Date()) {
    const me = await this.prisma.user.findUnique({ where: { id: userId }, select: { familyId: true } });
    if (!me) throw new NotFoundException();
    const members = await this.prisma.user.findMany({ where: { familyId: me.familyId }, select: { id: true, name: true, avatar: { select: { updatedAt: true } } } });
    const standings: Standing[] = [];
    for (const m of members) {
      const p = replay(await this.progress.journal(m.id));
      standings.push({
        userId: m.id,
        name: m.name,
        avatarUrl: avatarUrl(m.id, m.avatar),
        weekMinutes: minutesThisWeek(p, now),
        todayMinutes: minutesOn(p, dayKey(now)),
        streak: streak(p, now),
        lessonsDone: p.doneLessons.size,
      });
    }
    standings.sort((a, b) => b.weekMinutes - a.weekMinutes || b.streak - a.streak || a.name.localeCompare(b.name));
    return { weekStart: weekStart(dayKey(now)), standings };
  }
}
