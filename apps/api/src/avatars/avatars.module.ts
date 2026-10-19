import { Module } from '@nestjs/common';
import { AvatarsController } from './avatars.controller.js';
import { AvatarsService } from './avatars.service.js';

@Module({
  providers: [AvatarsService],
  controllers: [AvatarsController],
})
export class AvatarsModule {}
