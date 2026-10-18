import type { CookieOptions } from 'express';

/** Сессия — JWT в httpOnly-cookie: скрипт страницы её не прочитает. */
export const SESSION_COOKIE = 'session';

/** Семейное приложение: входят один раз и надолго. */
export const SESSION_DAYS = 180;

export function sessionCookie(production: boolean): CookieOptions {
  return {
    httpOnly: true,
    // lax: cookie уходит на свои запросы и на переход по ссылке, но не на
    // чужие формы — от CSRF этого достаточно, а API на том же домене.
    sameSite: 'lax',
    // В проде только https (Caddy). Локально — http, иначе cookie не встанет.
    secure: production,
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}
