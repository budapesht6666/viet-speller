import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProgressModule } from '../progress/progress.module.js';
import { CHAT_MODELS, chatModelsFactory } from './chat-model.js';
import { TalkController } from './talk.controller.js';
import { TalkService } from './talk.service.js';

@Module({
  imports: [ProgressModule],
  providers: [
    TalkService,
    // Собственный провайдер: под токеном CHAT_MODELS — цепочка моделей,
    // собранная фабрикой из конфигурации. В тестах её подменяют заглушкой.
    { provide: CHAT_MODELS, inject: [ConfigService], useFactory: chatModelsFactory },
  ],
  controllers: [TalkController],
})
export class TalkModule {}
