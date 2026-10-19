/**
 * Фото профиля: телефон сам уменьшает снимок до квадрата 256×256 и шлёт
 * JPEG на сервер. Снимок с камеры весит мегабайты, а в шапке он — кружок
 * в 32 точки.
 */

import { account, api } from './sync.js';

const SIZE = 256;
const QUALITY = 0.85;

export class ImageError extends Error {}

/**
 * Квадрат из середины снимка. Через <img>, а не createImageBitmap: так
 * браузер сам учитывает поворот из EXIF, и снимок с iPhone не ляжет на бок.
 */
export async function squareJpeg(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new ImageError('decode');
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new ImageError('empty');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('canvas');
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new ImageError('encode'))), 'image/jpeg', QUALITY));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setAvatar(avatarUrl: string | null): void {
  const a = account.value;
  if (a.state === 'user') account.value = { state: 'user', me: { ...a.me, avatarUrl } };
}

export async function uploadAvatar(file: Blob): Promise<void> {
  const form = new FormData();
  form.append('image', await squareJpeg(file), 'avatar.jpg');
  const res = await api<{ avatarUrl: string }>('/users/me/avatar', form, 'PUT');
  setAvatar(res.avatarUrl);
}

export async function removeAvatar(): Promise<void> {
  await api('/users/me/avatar', undefined, 'DELETE');
  setAvatar(null);
}
