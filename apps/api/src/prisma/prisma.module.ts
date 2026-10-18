import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Глобальный: база нужна почти каждому модулю (семья, прогресс, ачивки,
 * рейтинг), и импортировать её в каждый — шум. Провайдер один на приложение,
 * значит и соединение одно. См. NEST-NOTES.md, «Глобальный модуль».
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
