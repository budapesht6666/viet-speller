import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { FamilyModule } from '../family/family.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { SESSION_DAYS } from './session.js';

@Module({
  imports: [
    UsersModule,
    FamilyModule,
    JwtModule.registerAsync({
      // Секрет — из конфигурации: в репозитории его нет (CLAUDE.md, «Секреты»).
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: `${SESSION_DAYS}d` },
      }),
    }),
  ],
  providers: [
    AuthService,
    // Глобальный: закрыто всё, кроме @Public(). Регистрируется здесь, рядом
    // с самим guard, как советует документация.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
