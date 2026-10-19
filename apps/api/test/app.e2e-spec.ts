import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';

// Окружение — до импорта AppModule: ConfigModule читает его при загрузке.
const dir = mkdtempSync(join(tmpdir(), 'viet-api-'));
writeFileSync(join(dir, 'index.html'), '<!doctype html><title>web</title>');
process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`;
process.env.WEB_DIST = dir;
process.env.JWT_SECRET = 'test-secret-not-for-production';
// Та же команда, что накатит миграции в проде: тест проверяет и их.
execSync('npx prisma migrate deploy', { cwd: fileURLToPath(new URL('..', import.meta.url)), env: process.env, stdio: 'ignore' });
const { AppModule } = await import('../src/app.module.js');
const { setup } = await import('../src/setup.js');

let app: INestApplication;
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const lessonDone = (lessonId: string, seconds = 300) => ({
  id: uuid(),
  at: new Date().toISOString(),
  seconds,
  type: 'lesson-done',
  lessonId,
  grades: { 'abc-xa': 3 },
  accuracy: 0.9,
  mic: true,
});

beforeAll(async () => {
  // NestFactory, а не Test.createTestingModule: тестовый модуль создаёт
  // провайдеры раньше, чем у приложения появляется HTTP-адаптер, и
  // ServeStaticModule молча ставит пустой загрузчик. См. NEST-NOTES.md.
  app = setup(await NestFactory.create(AppModule, { logger: false }));
  await app.init();
});

afterAll(async () => {
  await app.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('инфраструктура', () => {
  it('/health отвечает 200, когда база открывается', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: { database: { status: 'up' } } });
  });

  it('фронтенд раздаётся с корня', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<title>web</title>');
  });

  it('неизвестный путь API — 404, а не index.html', async () => {
    await request(app.getHttpServer()).get('/api/nope').expect(404);
  });

  it('Swagger открывается', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200);
  });
});

describe('вход', () => {
  it('без сессии закрыто всё API, кроме входа', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer()).post('/api/sync').send({ since: 0, events: [] }).expect(401);
    await request(app.getHttpServer()).get('/api/leaderboard').expect(401);
  });

  it('регистрация ставит httpOnly-cookie и создаёт семью', async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent.post('/api/auth/register').send({ login: 'Pavel', password: 'long-password', name: 'Павел' }).expect(201);
    expect(String(res.headers['set-cookie'])).toMatch(/session=.+HttpOnly/i);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body).toMatchObject({ login: 'pavel', name: 'Павел', family: { name: 'Семья Павел' } });
    expect(me.body.family.inviteCode).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('логин занят — 409; неверный пароль — 401 без подсказки', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send({ login: 'pavel', password: 'other-password', name: 'X' }).expect(409);
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ login: 'pavel', password: 'wrong-password' }).expect(401);
    expect(res.body.message).toBe('Неверный логин или пароль');
    await request(app.getHttpServer()).post('/api/auth/login').send({ login: 'nobody', password: 'wrong-password' }).expect(401);
  });

  it('DTO проверяется: короткий пароль и лишние поля — 400', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send({ login: 'a1', password: 'short', name: 'A' }).expect(400);
    await request(app.getHttpServer()).post('/api/auth/register').send({ login: 'a2', password: 'long-password', name: 'A', admin: true }).expect(400);
  });

  it('выход снимает сессию', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' }).expect(200);
    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('семья, синхронизация, рейтинг', () => {
  const pavel = () => request.agent(app.getHttpServer());
  let invite = '';

  it('второй человек входит в семью по коду', async () => {
    const p = pavel();
    await p.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' });
    invite = (await p.get('/api/family').expect(200)).body.inviteCode;

    const anna = request.agent(app.getHttpServer());
    await anna.post('/api/auth/register').send({ login: 'anna', password: 'long-password', name: 'Аня', inviteCode: invite.toLowerCase() }).expect(201);
    const family = (await anna.get('/api/family').expect(200)).body;
    expect(family.members.map((m: { name: string }) => m.name)).toEqual(['Павел', 'Аня']);
  });

  it('неверный код семьи — 404', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send({ login: 'x3', password: 'long-password', name: 'X', inviteCode: 'ZZZZZZ' }).expect(404);
  });

  it('синхронизация идемпотентна: повторная пачка ничего не удваивает', async () => {
    const p = pavel();
    await p.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' });
    const batch = [lessonDone('alphabet-1'), lessonDone('alphabet-2')];
    const first = await p.post('/api/sync').send({ since: 0, events: batch }).expect(200);
    expect(first.body).toMatchObject({ accepted: 2, duplicates: 0, events: [] });
    const again = await p.post('/api/sync').send({ since: 0, events: batch }).expect(200);
    expect(again.body).toMatchObject({ accepted: 0, duplicates: 2 });
  });

  it('события с другого телефона приходят в ответе', async () => {
    const phone2 = pavel();
    await phone2.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' });
    const res = await phone2.post('/api/sync').send({ since: 0, events: [] }).expect(200);
    expect(res.body.events.map((e: { lessonId: string }) => e.lessonId)).toEqual(['alphabet-1', 'alphabet-2']);
    const after = await phone2.post('/api/sync').send({ since: res.body.cursor, events: [] }).expect(200);
    expect(after.body.events).toEqual([]);
  });

  it('событие неверной формы — 400', async () => {
    const p = pavel();
    await p.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' });
    await p.post('/api/sync').send({ since: 0, events: [{ ...lessonDone('x'), id: 'not-a-uuid' }] }).expect(400);
    await p.post('/api/sync').send({ since: 0, events: [{ ...lessonDone('x'), seconds: -5 }] }).expect(400);
    await p.post('/api/sync').send({ since: 0, events: [{ id: uuid(), at: new Date().toISOString(), seconds: 5, type: 'review', itemId: 'abc-xa', grade: 7 }] }).expect(400);
  });

  it('рейтинг семьи — по минутам за неделю, тем же кодом ядра', async () => {
    const anna = request.agent(app.getHttpServer());
    await anna.post('/api/auth/login').send({ login: 'anna', password: 'long-password' });
    await anna.post('/api/sync').send({ since: 0, events: [lessonDone('alphabet-1', 900)] }).expect(200);
    const res = await anna.get('/api/leaderboard').expect(200);
    expect(res.body.standings.map((s: { name: string; weekMinutes: number }) => [s.name, s.weekMinutes])).toEqual([
      ['Аня', 15],
      ['Павел', 10],
    ]);
    expect(res.body.standings[0]).toMatchObject({ streak: 1, lessonsDone: 1 });
  });
});

describe('ачивки', () => {
  it('личные — из своего журнала, семейные — из журналов всей семьи', async () => {
    // Павел и Аня из прошлых сценариев занимались сегодня оба.
    const anna = request.agent(app.getHttpServer());
    await anna.post('/api/auth/login').send({ login: 'anna', password: 'long-password' });
    const res = await anna.get('/api/achievements').expect(200);
    expect(res.body.earned).toContain('family-day');
    expect(res.body.family).toContain('family-day');
    expect(res.body.earned).not.toContain('streak-3');
  });
});

describe('журнал распознавания', () => {
  const said = (itemId: string, heard: string, engine = 'apple') => ({ id: uuid(), at: new Date().toISOString(), itemId, heard, engine });
  // Один вход на весь блок: вход ограничен по частоте (AUTH_LIMIT).
  let p: ReturnType<typeof request.agent>;
  beforeAll(async () => {
    p = request.agent(app.getHttpServer());
    await p.post('/api/auth/login').send({ login: 'pavel', password: 'long-password' }).expect(200);
  });

  it('без входа закрыт', async () => {
    await request(app.getHttpServer()).post('/api/speech').send({ attempts: [] }).expect(401);
    await request(app.getHttpServer()).get('/api/speech/report').expect(401);
  });

  it('приём идемпотентен, отчёт считает тем же кодом ядра', async () => {
    // pol-cam-on — «cảm ơn»: два слога. Тон расходится во второй попытке.
    const batch = [said('pol-cam-on', 'cảm ơn'), said('pol-cam-on', 'cám ơn'), said('pol-cam-on', ''), said('nope', 'x')];
    expect((await p.post('/api/speech').send({ attempts: batch }).expect(200)).body).toEqual({ accepted: 4, duplicates: 0 });
    expect((await p.post('/api/speech').send({ attempts: batch }).expect(200)).body).toEqual({ accepted: 0, duplicates: 4 });

    const res = await p.get('/api/speech/report').expect(200);
    expect(res.body.engines).toHaveLength(1);
    expect(res.body.engines[0]).toMatchObject({
      engine: 'apple',
      attempts: 3,
      tone: { compared: 2, different: 1, verdict: 'collecting', examples: [{ expected: 'cảm ơn', heard: 'cám ơn' }] },
      syllables: { multi: { attempts: 3, heard: 2 }, verdict: 'collecting' },
    });
  });

  it('попытка неверной формы — 400', async () => {
    await p.post('/api/speech').send({ attempts: [{ ...said('pol-cam-on', 'x'), engine: 'nokia' }] }).expect(400);
    await p.post('/api/speech').send({ attempts: [{ ...said('pol-cam-on', 'x'), id: 'nope' }] }).expect(400);
  });
});
