import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

/**
 * Настройка приложения поверх модулей. Вынесена из main.ts, чтобы e2e-тест
 * поднимал ровно то же, что прод, а не свою копию.
 */
export function setup<T extends INestApplication>(app: T): T {
  // Всё API под /api, кроме проверки здоровья: её путь знает vps-ops,
  // и он одинаков у всех приложений на сервере.
  app.setGlobalPrefix('api', { exclude: ['health'] });
  // SIGTERM от docker stop доходит до onModuleDestroy — база закрывается
  // штатно, а не обрывом посреди записи.
  app.enableShutdownHooks();
  // Сессия — в cookie: её читает AuthGuard.
  app.use(cookieParser());
  // За Caddy адрес клиента — в X-Forwarded-For. Без этого лимит запросов
  // считал бы всех одним адресом прокси и закрыл бы вход всей семье разом.
  (app as unknown as NestExpressApplication).set('trust proxy', 1);
  // DTO проверяются на входе каждого маршрута. Лишние поля — ошибка, а не
  // молчаливый мусор в базе.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const doc = new DocumentBuilder().setTitle('Viet Speller API').setDescription('Семья, прогресс, рейтинг').setVersion('1').build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, doc));
  return app;
}
