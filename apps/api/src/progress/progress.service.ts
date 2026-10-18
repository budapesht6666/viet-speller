import { Injectable } from '@nestjs/common';
import type { ProgressEvent } from '@viet/core';
import { PrismaService } from '../prisma/prisma.service.js';
import type { EventDto } from './progress.dto.js';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Приём пачки событий и выдача того, чего на телефоне ещё нет.
   *
   * Идемпотентно по id события: повторная отправка той же пачки (телефон
   * не дождался ответа и шлёт снова) ничего не удваивает. Событие с чужим
   * id молча пропускается — мы не сообщаем, что такой id у кого-то есть.
   *
   * В ответе — события этого же человека с других телефонов после курсора
   * `since`, кроме только что присланных: их телефон и так знает.
   */
  async sync(userId: string, incoming: EventDto[], since: number) {
    const ids = incoming.map((e) => e.id);
    const existing = new Set((await this.prisma.event.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((e) => e.id));
    const fresh = incoming.filter((e) => !existing.has(e.id));
    // createMany без skipDuplicates: на SQLite его нет. Дубли отсеяны выше,
    // а одновременную отправку одной пачки с двух вкладок закрывает unique по id.
    if (fresh.length) {
      await this.prisma.event.createMany({
        data: fresh.map((e) => ({ id: e.id, userId, type: e.type, at: new Date(e.at), seconds: e.seconds, payload: JSON.stringify(e) })),
      });
    }

    const rows = await this.prisma.event.findMany({
      where: { userId, seq: { gt: since }, id: { notIn: ids } },
      orderBy: { seq: 'asc' },
    });
    const last = await this.prisma.event.findFirst({ where: { userId }, orderBy: { seq: 'desc' }, select: { seq: true } });
    return {
      accepted: fresh.length,
      duplicates: incoming.length - fresh.length,
      events: rows.map((r) => JSON.parse(r.payload) as ProgressEvent),
      cursor: last?.seq ?? 0,
    };
  }

  /** Весь журнал человека — для рейтинга и ачивок, которые сервер считает сам. */
  async journal(userId: string): Promise<ProgressEvent[]> {
    const rows = await this.prisma.event.findMany({ where: { userId }, orderBy: { seq: 'asc' }, select: { payload: true } });
    return rows.map((r) => JSON.parse(r.payload) as ProgressEvent);
  }
}
