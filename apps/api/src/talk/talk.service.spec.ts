import { BadGatewayException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ProgressEvent } from '@viet/core';
import { ProgressService } from '../progress/progress.service.js';
import { CHAT_MODELS, RateLimited, type ChatModel, type NpcLine } from './chat-model.js';
import { TalkService } from './talk.service.js';

const LINE: NpcLine = { vi: 'Chào anh, mua gì?', ru: 'Здравствуйте, что берёте?', hint: 'cho tôi một ký xoài', hint_ru: 'дайте килограмм манго', done: false };

class FakeModel implements ChatModel {
  calls: { system: string; transcript: string }[] = [];
  constructor(
    readonly name: string,
    private readonly answer: () => NpcLine,
  ) {}
  async reply(system: string, transcript: string) {
    this.calls.push({ system, transcript });
    return this.answer();
  }
}

const limited = () => {
  throw new RateLimited('429');
};
const broken = () => {
  throw new Error('500');
};

const journal: ProgressEvent[] = [
  { id: 'e1', at: '2026-10-18T03:00:00.000Z', seconds: 120, type: 'lesson-done', lessonId: 'market-1', grades: {}, accuracy: 1, mic: true },
];

async function service(models: ChatModel[]) {
  const ref = await Test.createTestingModule({
    providers: [TalkService, { provide: ProgressService, useValue: { journal: async () => journal } }, { provide: CHAT_MODELS, useValue: models }],
  }).compile();
  return ref.get(TalkService);
}

describe('TalkService', () => {
  it('отдаёт реплику первой модели, а в инструкцию кладёт пройденные слова', async () => {
    const gemini = new FakeModel('gemini', () => LINE);
    const res = await (await service([gemini])).reply('u1', 'market', []);
    expect(res).toMatchObject({ vi: LINE.vi, hintRu: LINE.hint_ru, done: false, model: 'gemini' });
    expect(gemini.calls[0]!.system).toContain('xoài');
    // Не пройденное в словарь не попадает.
    expect(gemini.calls[0]!.system).not.toContain('bớt');
  });

  it('лимит первой модели — отвечает следующая', async () => {
    const groq = new FakeModel('groq', () => LINE);
    const res = await (await service([new FakeModel('gemini', limited), groq])).reply('u1', 'market', [{ who: 'npc', vi: 'Chào anh' }]);
    expect(res.model).toBe('groq');
    expect(groq.calls[0]!.transcript).toContain('Ты: Chào anh');
  });

  it('лимит у всех — «отдыхает» (503), а не поломка', async () => {
    const s = await service([new FakeModel('gemini', limited), new FakeModel('groq', limited)]);
    await expect(s.reply('u1', 'market', [])).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('модель сломалась — 502 с просьбой повторить', async () => {
    const s = await service([new FakeModel('gemini', limited), new FakeModel('groq', broken)]);
    await expect(s.reply('u1', 'market', [])).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('ни одного ключа — 503 «не настроен»', async () => {
    await expect((await service([])).reply('u1', 'market', [])).rejects.toThrow('не настроен');
  });

  it('неизвестный сценарий — 404', async () => {
    await expect((await service([new FakeModel('gemini', () => LINE)])).reply('u1', 'nope', [])).rejects.toBeInstanceOf(NotFoundException);
  });
});
