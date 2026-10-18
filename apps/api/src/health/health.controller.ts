import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * `/health` для проверки контейнера (vps-ops). Отвечает 200, только если
 * открывается база: живой процесс с недоступным файлом SQLite — не здоровье,
 * а сломанное приложение, которое докер иначе считал бы рабочим.
 *
 * Без префикса `/api` — см. main.ts.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database', this.prisma)]);
  }
}
