import { BadGatewayException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { item, lessons, scenario, type Scenario } from '@viet/content';
import { replay } from '@viet/core';
import { ProgressService } from '../progress/progress.service.js';
import { CHAT_MODELS, RateLimited, type ChatModel, type NpcLine } from './chat-model.js';
import type { TurnDto } from './talk.dto.js';

/**
 * ИИ-собеседник: следующая реплика ролевого диалога.
 *
 * Словарь — из журнала человека тем же `replay`, что считает прогресс:
 * модель держится того, что человек уже прошёл (PLAN.md, этап 11).
 */
@Injectable()
export class TalkService {
  private readonly log = new Logger(TalkService.name);

  constructor(
    private readonly progress: ProgressService,
    @Inject(CHAT_MODELS) private readonly models: ChatModel[],
  ) {}

  async reply(userId: string, scenarioId: string, turns: TurnDto[]) {
    const sc = scenario(scenarioId);
    if (!sc) throw new NotFoundException('Нет такого разговора');
    if (!this.models.length) throw new ServiceUnavailableException('Собеседник не настроен на сервере');

    const p = replay(await this.progress.journal(userId));
    const known = lessons.filter((l) => p.doneLessons.has(l.id)).flatMap((l) => l.items.map((id) => item(id).vi));
    const system = prompt(sc, known);
    const transcript = conversation(turns);

    let limited = 0;
    for (const model of this.models) {
      try {
        const line: NpcLine = await model.reply(system, transcript);
        return { vi: line.vi, ru: line.ru, hint: line.hint, hintRu: line.hint_ru, done: line.done, model: model.name };
      } catch (e) {
        if (e instanceof RateLimited) limited++;
        this.log.warn(`${model.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    // Все упёрлись в лимит — это не поломка, у этого состояния свой вид.
    if (limited === this.models.length) throw new ServiceUnavailableException('Собеседник отдыхает: лимит бесплатного тарифа. Попробуй через минуту, а если не выйдет — завтра');
    throw new BadGatewayException('Собеседник не ответил. Попробуй ещё раз');
  }
}

function prompt(sc: Scenario, known: string[]): string {
  return [
    `Ты играешь роль: ${sc.role} в Дананге (Центральный Вьетнам). С тобой говорит русскоязычный человек, который учит вьетнамский с нуля и живёт здесь.`,
    `Его цель в этом разговоре: ${sc.goal}.`,
    'Правила:',
    '- Отвечай по-вьетнамски одной короткой репликой: до 12 слов, простая разговорная речь, стандартное письмо со всеми знаками тона.',
    `- Используй прежде всего слова, которые он уже знает: ${known.join(', ') || '(пока почти ничего: только самые простые слова)'}. Новое слово — не больше одного за реплику и только если без него никак.`,
    '- Он говорит через распознавание речи: в его репликах бывают ошибки и пропущенные слова. Понимай по смыслу, не поправляй его и не объясняй грамматику.',
    '- В поле vi — только вьетнамский, без русского и английского.',
    '- Обращайся к нему вежливо, как принято с незнакомым взрослым.',
    '- Когда цель достигнута или разговор естественно закончился, попрощайся и поставь done = true.',
    'Верни JSON: vi — твоя реплика; ru — её точный перевод на русский; hint — короткий вариант его ответа по-вьетнамски из знакомых ему слов; hint_ru — перевод подсказки; done — true или false.',
  ].join('\n');
}

function conversation(turns: TurnDto[]): string {
  if (!turns.length) return 'Разговор только начинается. Скажи первую реплику.';
  const lines = turns.map((t) => `${t.who === 'npc' ? 'Ты' : 'Он'}: ${t.vi}`);
  return `Разговор до сих пор:\n${lines.join('\n')}\n\nСкажи следующую реплику.`;
}
