#!/usr/bin/env node
/**
 * Озвучка: текст → mp3, имя файла — хеш «движок + голос + скорость + текст».
 *
 *   node scripts/tts.mjs --from research/vi-probe-prompts.json --out research/audio
 *
 * Повторный запуск ничего не перегенерирует: файл с таким хешем уже лежит,
 * и квота (у ElevenLabs она есть) не тратится. В рантайме приложения синтеза
 * нет — файлы коммитятся, и тон все учат по одному образцу.
 *
 * Рядом с файлами пишется `manifest.json`: ключ `голос|скорость|текст` → имя
 * файла. Клиент ищет образец по ключу и не считает хеш сам.
 *
 * Движок пока один — edge-tts (Python-пакет `edge-tts`, бесплатно, без лимита).
 * **Текст передаётся файлом, а не в argv**: на Windows не-ASCII в аргументах
 * дочернего процесса ломается, а во вьетнамском не-ASCII почти каждый слог.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const VOICES = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
export const RATE_NORMAL = '+0%';

const EDGE_TTS = process.env.EDGE_TTS ?? 'edge-tts';
const PARALLEL = 3;
/** Меньше этого — не звук, а пустой контейнер или текст ошибки. */
const MIN_BYTES = 1000;

/** Ключ в манифесте. Текст в NFC: одна буква бывает записана двумя способами. */
export function manifestKey({ voice, rate, text }) {
  return `${voice}|${rate}|${text.normalize('NFC')}`;
}

export function fileName(job) {
  const hash = createHash('sha256').update(`edge|${manifestKey(job)}`).digest('hex');
  return `${hash.slice(0, 16)}.mp3`;
}

function run(cmd, args) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) return ok();
      // Microsoft время от времени меняет токен Sec-MS-GEC, и старый пакет
      // получает 403 на каждый запрос. Чинится только обновлением.
      if (/WSServerHandshakeError: 403/.test(err)) {
        return fail(new Error('сервис ответил 403 — обнови пакет: pip install -U edge-tts'));
      }
      const last = err.trim().split('\n').at(-1);
      fail(new Error(`${cmd} завершился с кодом ${code}: ${last}`));
    });
  });
}

async function exists(path) {
  try {
    return (await stat(path)).size >= MIN_BYTES;
  } catch {
    return false;
  }
}

async function synthesizeOne(job, outDir, scratch) {
  const out = join(outDir, fileName(job));
  if (await exists(out)) return 'cached';

  const textFile = join(scratch, `${fileName(job)}.txt`);
  await writeFile(textFile, job.text.normalize('NFC'), 'utf8');

  // Сервис изредка рвёт соединение — два повтора дешевле, чем ручной перезапуск.
  for (let attempt = 1; ; attempt++) {
    try {
      await run(EDGE_TTS, ['--voice', job.voice, `--rate=${job.rate}`, '-f', textFile, '--write-media', out]);
      if (!(await exists(out))) throw new Error('файл пустой');
      return 'new';
    } catch (e) {
      await rm(out, { force: true });
      if (attempt >= 3) throw new Error(`«${job.text}» (${job.voice}): ${e.message}`);
    }
  }
}

/** Озвучивает задания и дописывает манифест. Возвращает счётчики. */
export async function synthesize(jobs, outDir) {
  await mkdir(outDir, { recursive: true });
  const manifestPath = join(outDir, 'manifest.json');
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    /* манифеста ещё нет */
  }

  const scratch = await mkdtemp(join(tmpdir(), 'tts-'));
  const counts = { new: 0, cached: 0 };
  const queue = [...jobs];
  try {
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        for (let job = queue.shift(); job; job = queue.shift()) {
          counts[await synthesizeOne(job, outDir, scratch)]++;
          manifest[manifestKey(job)] = fileName(job);
        }
      }),
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
    const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  }
  return counts;
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const from = arg('from');
  const out = arg('out');
  if (!from || !out) {
    console.error('node scripts/tts.mjs --from <prompts.json> --out <dir>');
    process.exit(2);
  }
  const { prompts } = JSON.parse(await readFile(resolve(from), 'utf8'));
  const texts = [...new Set(prompts.map((p) => p.text.normalize('NFC')))];
  const jobs = texts.flatMap((text) => VOICES.map((voice) => ({ text, voice, rate: RATE_NORMAL })));

  const counts = await synthesize(jobs, resolve(out));
  console.log(`готово: новых ${counts.new}, из кеша ${counts.cached}`);
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('tts.mjs')) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
