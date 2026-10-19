import { Module } from '@nestjs/common';
import { SpeechController } from './speech.controller.js';
import { SpeechService } from './speech.service.js';

@Module({
  providers: [SpeechService],
  controllers: [SpeechController],
})
export class SpeechModule {}
