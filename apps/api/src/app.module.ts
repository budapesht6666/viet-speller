import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    // Глобальный: конфигурация нужна всем, а .env читается один раз.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    /**
     * Nest раздаёт и собранный фронтенд: один контейнер, один домен, cookie
     * без CORS (PLAN.md, этап 6). Путь — из конфигурации, а не зашит: в
     * контейнере фронтенд лежит не там, где в репозитории.
     *
     * `/api` и `/health` исключены: иначе неизвестный путь API вернул бы
     * index.html с кодом 200 вместо 404, и клиент разбирал бы HTML как JSON.
     */
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // Абсолютный: express.static считает относительный путь от рабочей
          // папки процесса, а она у `npm -w` и у контейнера разная.
          rootPath: resolve(config.getOrThrow<string>('WEB_DIST')),
          exclude: ['/api/{*splat}', '/health'],
        },
      ],
    }),
  ],
})
export class AppModule {}
