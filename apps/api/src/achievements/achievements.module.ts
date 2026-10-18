import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module.js';
import { AchievementsController } from './achievements.controller.js';
import { AchievementsService } from './achievements.service.js';

@Module({
  imports: [ProgressModule],
  providers: [AchievementsService],
  controllers: [AchievementsController],
})
export class AchievementsModule {}
