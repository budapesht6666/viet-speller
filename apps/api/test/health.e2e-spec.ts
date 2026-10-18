import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { App } from 'supertest/types';

// Окружение — до импорта AppModule: ConfigModule читает его при загрузке.
const dir = mkdtempSync(join(tmpdir(), 'viet-api-'));
writeFileSync(join(dir, 'index.html'), '<!doctype html><title>web</title>');
process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`;
process.env.WEB_DIST = dir;
const { AppModule } = await import('../src/app.module.js');
const { setup } = await import('../src/setup.js');

describe('приложение целиком', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // NestFactory, а не Test.createTestingModule: тестовый модуль создаёт
    // провайдеры раньше, чем у приложения появляется HTTP-адаптер, и
    // ServeStaticModule молча ставит пустой загрузчик — фронтенд не
    // раздаётся только в тесте. См. NEST-NOTES.md.
    app = setup(await NestFactory.create<INestApplication<App>>(AppModule, { logger: false }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('/health отвечает 200, когда база открывается', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: { database: { status: 'up' } } });
  });

  it('фронтенд раздаётся с корня', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('<title>web</title>');
  });

  it('неизвестный путь API — 404, а не index.html', async () => {
    // Иначе клиент получил бы HTML с кодом 200 и разбирал бы его как JSON.
    await request(app.getHttpServer()).get('/api/nope').expect(404);
  });
});
