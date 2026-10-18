import type { Item } from '@viet/core';

type Extra = Partial<Omit<Item, 'id' | 'vi' | 'ru' | 'kind'>>;

/** Слово — в том числе составное (`cà phê`, `năm mươi nghìn`). */
export const word = (id: string, vi: string, ru: string, extra: Extra = {}): Item => ({ id, vi, ru, kind: 'word', ...extra });

/** Фраза: каждое её слово должно быть введено раньше или в том же уроке. */
export const phrase = (id: string, vi: string, ru: string, extra: Extra = {}): Item => ({ id, vi, ru, kind: 'phrase', ...extra });
