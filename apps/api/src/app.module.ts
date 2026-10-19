import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FamilyModule } from './family/family.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { AchievementsModule } from './achievements/achievements.module.js';
import { TalkModule } from './talk/talk.module.js';
import { SpeechModule } from './speech/speech.module.js';

@Module({
  imports: [
    // Глобальный: конфигурация нужна всем, а .env читается один раз.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    // Лимит запросов с одного адреса — общий для всего API. Вход и
    // регистрация затянуты сильнее (@Throttle в AuthController).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
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
    UsersModule,
    AuthModule,
    FamilyModule,
    ProgressModule,
    LeaderboardModule,
    AchievementsModule,
    TalkModule,
    SpeechModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
