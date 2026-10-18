import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Клиент базы как провайдер Nest — рецепт https://docs.nestjs.com/data/prisma.
 *
 * Prisma 7 ходит в SQLite через драйвер-адаптер better-sqlite3. Путь к файлу
 * берётся из DATABASE_URL через ConfigService, а не из process.env напрямую:
 * так конфигурацию можно подменить в тестах, не трогая окружение процесса.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaBetterSqlite3({ url: config.getOrThrow<string>('DATABASE_URL') }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
