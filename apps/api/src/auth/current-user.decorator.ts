import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Что guard кладёт в запрос после проверки сессии. */
export interface SessionUser {
  id: string;
}

export type AuthedRequest = Request & { user?: SessionUser };

/**
 * id вошедшего пользователя: `mine(@CurrentUser() userId: string)`.
 * Собственный декоратор параметра, чтобы контроллеры не лезли в объект
 * запроса за `request.user.id`. См. NEST-NOTES.md, «Декоратор параметра».
 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
  if (!user) throw new Error('CurrentUser на публичном маршруте');
  return user.id;
});
