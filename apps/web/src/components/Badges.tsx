import { achievements } from '@viet/content';
import { Icon } from './ui.js';

/** Ачивки сеткой. Неполученные — бледные, но видны: понятно, к чему идти. */
export function Badges({ earned, only }: { earned: Set<string>; only?: string[] }) {
  const list = only ? achievements.filter((a) => only.includes(a.id)) : achievements;
  return (
    <ul class="badges">
      {list.map((a) => (
        <li key={a.id} class="badge" data-earned={earned.has(a.id)}>
          <Icon name={a.icon.name} set={a.icon.set} size={40} />
          <span class="badge__title">{a.title}</span>
          <span class="caption">{a.description}</span>
        </li>
      ))}
    </ul>
  );
}
