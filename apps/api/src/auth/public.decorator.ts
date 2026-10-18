import { SetMetadata } from '@nestjs/common';

/**
 * Маршрут без входа. Guard входа глобальный (auth.module.ts), поэтому
 * закрыто всё, кроме помеченного этим декоратором, — забытая пометка
 * закрывает маршрут, а не открывает. Рецепт — docs.nestjs.com/security/authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
