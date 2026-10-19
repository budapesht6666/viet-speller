import { Injectable } from '@nestjs/common';
import { speechReport, type SpeechAttempt, type SpeechEngine } from '@viet/core';
import { items } from '@viet/content';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SpeechAttemptDto } from './speech.dto.js';

const byId = new Map(items.map((i) => [i.id, i]));

@Injectable()
export class SpeechService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Приём пачки попыток. Идемпотентно по id, как журнал прогресса: телефон
   * не дождался ответа и шлёт снова — ничего не удваивается.
   */
  async log(userId: string, incoming: SpeechAttemptDto[]) {
    const ids = incoming.map((a) => a.id);
    const existing = new Set((await this.prisma.speechAttempt.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((a) => a.id));
    const fresh = incoming.filter((a) => !existing.has(a.id));
    if (fresh.length) {
      await this.prisma.speechAttempt.createMany({
        data: fresh.map((a) => ({ id: a.id, userId, at: new Date(a.at), itemId: a.itemId, heard: a.heard, engine: a.engine })),
      });
    }
    return { accepted: fresh.length, duplicates: incoming.length - fresh.length };
  }

  /**
   * Отчёт по всем попыткам на сервере, а не по семье: вопрос — о движке
   * распознавания, а не о людях. Чем больше попыток, тем раньше ответ.
   * Наружу уходят только счётчики и примеры «образец → услышано».
   */
  async report() {
    const rows = await this.prisma.speechAttempt.findMany({ select: { id: true, at: true, itemId: true, heard: true, engine: true } });
    const attempts: SpeechAttempt[] = rows.map((r) => ({ ...r, at: r.at.toISOString(), engine: r.engine as SpeechEngine }));
    return { engines: speechReport(attempts, (id) => byId.get(id)) };
  }
}
