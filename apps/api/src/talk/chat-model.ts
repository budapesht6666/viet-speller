/**
 * Языковая модель собеседника — за интерфейсом: сервису всё равно, Gemini
 * это или Groq. Цепочку моделей собирает фабрика в talk.module.ts по тому,
 * какие ключи есть в .env. См. NEST-NOTES.md, «Собственный провайдер».
 *
 * Только бесплатные тарифы (CLAUDE.md, «Рамки»). Лимит тарифа кончился —
 * модель бросает RateLimited, и сервис пробует следующую.
 */

import { ConfigService } from '@nestjs/config';

/** Реплика собеседника, как её возвращает модель. */
export interface NpcLine {
  vi: string;
  ru: string;
  hint: string;
  hint_ru: string;
  done: boolean;
}

export interface ChatModel {
  readonly name: string;
  /** Одна реплика: инструкция и весь разговор текстом. */
  reply(system: string, transcript: string): Promise<NpcLine>;
}

/** Лимит бесплатного тарифа исчерпан — на минуту или до завтра. */
export class RateLimited extends Error {}

/** Токен внедрения: массив моделей в порядке, в котором их пробовать. */
export const CHAT_MODELS = Symbol('CHAT_MODELS');

/** Схема ответа — одна на обе модели. */
const FIELDS = ['vi', 'ru', 'hint', 'hint_ru'] as const;

function parseLine(text: string): NpcLine {
  const raw = JSON.parse(text) as Record<string, unknown>;
  for (const f of FIELDS) if (typeof raw[f] !== 'string') throw new Error(`в ответе модели нет поля ${f}`);
  const line = raw as unknown as NpcLine;
  if (!line.vi.trim()) throw new Error('пустая реплика');
  return { vi: line.vi.trim(), ru: line.ru.trim(), hint: line.hint.trim(), hint_ru: line.hint_ru.trim(), done: raw.done === true };
}

/** Ответ дольше этого — модель считаем недоступной и идём к следующей. */
const TIMEOUT_MS = 15_000;

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429) throw new RateLimited(url);
  if (!res.ok) throw new Error(`${url}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}

/**
 * Gemini, бесплатный тариф AI Studio. По умолчанию flash-lite: отвечает за
 * 1–2 с, а flash с размышлениями — за 8–10, для разговора это слишком долго
 * (замер 19.10.2026).
 */
export class GeminiModel implements ChatModel {
  readonly name: string;

  constructor(
    private readonly key: string,
    private readonly model: string,
  ) {
    this.name = `gemini:${model}`;
  }

  async reply(system: string, transcript: string): Promise<NpcLine> {
    const res = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      { 'x-goog-api-key': this.key },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: transcript }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: { vi: { type: 'STRING' }, ru: { type: 'STRING' }, hint: { type: 'STRING' }, hint_ru: { type: 'STRING' }, done: { type: 'BOOLEAN' } },
            required: ['vi', 'ru', 'hint', 'hint_ru', 'done'],
          },
        },
      },
    );
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!text) throw new Error('Gemini вернул пустой ответ');
    return parseLine(text);
  }
}

/** Groq, бесплатный тариф: OpenAI-совместимый API. Запасная модель. */
export class GroqModel implements ChatModel {
  readonly name: string;

  constructor(
    private readonly key: string,
    private readonly model: string,
  ) {
    this.name = `groq:${model}`;
  }

  async reply(system: string, transcript: string): Promise<NpcLine> {
    const res = await post(
      'https://api.groq.com/openai/v1/chat/completions',
      { Authorization: `Bearer ${this.key}` },
      {
        model: this.model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${system}\nОтвет — только JSON-объект с полями vi, ru, hint, hint_ru, done.` },
          { role: 'user', content: transcript },
        ],
      },
    );
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq вернул пустой ответ');
    return parseLine(text);
  }
}

/** Фабрика провайдера CHAT_MODELS: модель без ключа в цепочку не попадает. */
export function chatModelsFactory(config: ConfigService): ChatModel[] {
  const models: ChatModel[] = [];
  const gemini = config.get<string>('GEMINI_API_KEY');
  if (gemini) models.push(new GeminiModel(gemini, config.get<string>('GEMINI_MODEL') ?? 'gemini-flash-lite-latest'));
  const groq = config.get<string>('GROQ_API_KEY');
  if (groq) models.push(new GroqModel(groq, config.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-120b'));
  return models;
}
