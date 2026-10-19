/**
 * Адрес фото профиля. Время обновления — в адресе: новое фото получает
 * новый адрес, и браузер может кешировать картинку навсегда.
 */
export function avatarUrl(userId: string, avatar: { updatedAt: Date } | null | undefined): string | null {
  return avatar ? `/api/users/${userId}/avatar?v=${avatar.updatedAt.getTime()}` : null;
}
