/**
 * Service worker — при запуске, а не в компоненте: регистрация не должна
 * зависеть от того, открыта ли вкладка, где показан её статус.
 */

import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

export type PwaState = 'pending' | 'ready' | 'error' | 'update';
export const pwa = signal<PwaState>('pending');

let update: ((reload?: boolean) => Promise<void>) | null = null;

export function startPwa(): void {
  update = registerSW({
    onRegisteredSW: () => {
      if (pwa.value === 'pending') pwa.value = 'ready';
    },
    onOfflineReady: () => {
      if (pwa.value !== 'update') pwa.value = 'ready';
    },
    onNeedRefresh: () => (pwa.value = 'update'),
    onRegisterError: () => (pwa.value = 'error'),
  });
}

export function applyUpdate(): void {
  void update?.(true);
}
