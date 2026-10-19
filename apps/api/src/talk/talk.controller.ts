import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { TalkDto } from './talk.dto.js';
import { TalkService } from './talk.service.js';

@ApiTags('talk')
@Controller('talk')
export class TalkController {
  constructor(private readonly talk: TalkService) {}

  /**
   * Следующая реплика собеседника. Лимит строже общего: квота бесплатного
   * тарифа одна на всю семью, и один телефон не должен съесть её за минуту.
   */
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @HttpCode(200)
  @Post()
  reply(@CurrentUser() userId: string, @Body() dto: TalkDto) {
    return this.talk.reply(userId, dto.scenarioId, dto.turns);
  }
}
