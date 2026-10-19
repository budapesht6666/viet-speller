import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SpeechLogDto } from './speech.dto.js';
import { SpeechService } from './speech.service.js';

@ApiTags('speech')
@Controller('speech')
export class SpeechController {
  constructor(private readonly speech: SpeechService) {}

  /** Пачка попыток сказать — в журнал распознавания. */
  @HttpCode(200)
  @Post()
  log(@CurrentUser() userId: string, @Body() dto: SpeechLogDto) {
    return this.speech.log(userId, dto.attempts);
  }

  /** Пишет ли движок тон и слышит ли слог — по всем попыткам. */
  @Get('report')
  report() {
    return this.speech.report();
  }
}
