import type { INestApplication } from '@nestjs/common';

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
  return app;
}
