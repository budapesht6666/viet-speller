import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AchievementsService } from './achievements.service.js';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  get(@CurrentUser() userId: string) {
    return this.achievements.of(userId);
  }
}
