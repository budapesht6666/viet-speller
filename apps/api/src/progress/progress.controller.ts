import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SyncDto } from './progress.dto.js';
import { ProgressService } from './progress.service.js';

@ApiTags('progress')
@Controller()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  /** Пачка событий с телефона → в журнал; в ответ — события с других телефонов. */
  @HttpCode(200)
  @Post('sync')
  sync(@CurrentUser() userId: string, @Body() dto: SyncDto) {
    return this.progress.sync(userId, dto.events, dto.since);
  }
}
