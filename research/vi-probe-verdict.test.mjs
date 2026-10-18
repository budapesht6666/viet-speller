// node research/vi-probe-verdict.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareSequence, syllable, verdict, verdictLabel, words } from './vi-probe-verdict.mjs';

test('тон слога не зависит от того, над какой буквой стоит знак', () => {
  assert.deepEqual(syllable('hoà'), syllable('hòa'));
  assert.equal(syllable('mả').tone, 3);
  assert.equal(syllable('ma').tone, 0);
});

test('бреве и циркумфлекс — часть буквы, а не тон', () => {
  assert.equal(syllable('ăn').tone, 0);
  assert.equal(syllable('ấy').base, 'ây');
});

test('пунктуация и регистр не мешают', () => {
  assert.deepEqual(words('Xin chào!'), ['xin', 'chào']);
  assert.deepEqual(words('50.000 đồng'), ['50', '000', 'đồng']);
});

test('фраза внутри длинной расшифровки находится', () => {
  assert.equal(compareSequence(words('à cảm ơn anh nhé'), words('cảm ơn anh')).level, 'exact');
});

test('другой тон опознаётся как «тон другой», а не «не совпало»', () => {
  const r = compareSequence(words('má'), words('mả'));
  assert.equal(r.level, 'tone');
  assert.deepEqual(r.toneDiffs, [{ at: 0, heard: 'sắc', said: 'hỏi' }]);
});

test('другая гласная — только после полной свёртки', () => {
  assert.equal(compareSequence(words('mo'), words('mơ')).level, 'fold');
});

test('неверный тон: различаем «как сказано» и «исправил»', () => {
  const p = { group: 'wrongTone', text: 'xin chạo', corrected: 'xin chào' };
  assert.equal(verdictLabel(p, verdict(p, 'Xin chạo')), 'записал как сказано');
  assert.equal(verdictLabel(p, verdict(p, 'Xin chào')), 'исправил по смыслу');
});

test('числа цифрами', () => {
  const p = { group: 'number', text: 'năm mươi nghìn' };
  assert.equal(verdictLabel(p, verdict(p, '50.000')), 'цифрами');
  assert.equal(verdictLabel(p, verdict(p, 'năm mươi nghìn')), 'совпало с тонами');
});

test('пустая расшифровка', () => {
  const p = { group: 'syllable', text: 'ba' };
  assert.equal(verdictLabel(p, verdict(p, '  ')), 'ничего не пришло');
});
