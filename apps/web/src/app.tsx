import { Done } from './screens/Done.js';
import { Family } from './screens/Family.js';
import { Home } from './screens/Home.js';
import { LessonScreen, ReviewScreen } from './screens/Sessions.js';
import { route } from './store/app.js';

export function App() {
  const r = route.value;
  switch (r.name) {
    case 'lesson':
      // key: тот же урок заново — новый проигрыватель с нуля.
      return <LessonScreen key={r.lessonId} lessonId={r.lessonId} />;
    case 'review':
      return <ReviewScreen />;
    case 'done':
      return <Done summary={r.summary} />;
    case 'family':
      return <Family />;
    default:
      return <Home />;
  }
}
