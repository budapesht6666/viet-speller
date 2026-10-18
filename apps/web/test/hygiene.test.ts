/**
 * Правила интерфейса из CLAUDE.md, которые иначе проверялись бы руками.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { strings } from '../src/strings.js';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}

const sources = files(SRC)
  .filter((f) => /\.(css|tsx?)$/.test(f) && !f.endsWith('tokens.css'))
  .map((f) => ({ file: f.slice(SRC.length + 1), text: readFileSync(f, 'utf8') }));

describe('оформление только из tokens.css', () => {
  it('нет сырых цветов', () => {
    const bad = sources.filter((s) => /#[0-9a-fA-F]{3,8}\b/.test(s.text)).map((s) => s.file);
    expect(bad).toEqual([]);
  });

  it('нет сырых кеглей', () => {
    const bad = sources.filter((s) => /font-size:\s*\d/.test(s.text)).map((s) => s.file);
    expect(bad).toEqual([]);
  });
});

describe('одна кривая движения', () => {
  it('в motion.ts те же числа, что в --ease-out', () => {
    const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8');
    const motion = readFileSync(join(SRC, 'ui', 'motion.ts'), 'utf8');
    const css = /--ease-out:\s*cubic-bezier\(([^)]+)\)/.exec(tokens)?.[1];
    const ts = /EASE_OUT_POINTS = \[([^\]]+)\]/.exec(motion)?.[1];
    const nums = (s: string | undefined) => (s ?? '').split(',').map(Number);
    expect(nums(ts)).toEqual(nums(css));
    expect(nums(css)).toHaveLength(4);
  });
});

describe('строки интерфейса', () => {
  it('ни одной пустой', () => {
    const empty = Object.entries(strings).filter(([, v]) => !v.trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });
});

describe('эмодзи не используются нигде', () => {
  it('ни в строках, ни в разметке', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    const bad = sources.filter((s) => emoji.test(s.text)).map((s) => s.file);
    expect(bad).toEqual([]);
  });
});
