import { TabBar } from './components/TabBar.js';
import { Done } from './screens/Done.js';
import { Family } from './screens/Family.js';
import { Home } from './screens/Home.js';
import { Phrasebook } from './screens/Phrasebook.js';
import { Progress } from './screens/Progress.js';
import { LessonScreen, ReviewScreen } from './screens/Sessions.js';
import { Talk } from './screens/Talk.js';
import { route, TAB_NAMES } from './store/app.js';

function Screen() {
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
    case 'phrasebook':
      return <Phrasebook />;
    case 'progress':
      return <Progress />;
    case 'talk':
      return <Talk />;
    default:
      return <Home />;
  }
}

export function App() {
  return (
    <>
      <Screen />
      {TAB_NAMES.has(route.value.name) && <TabBar />}
    </>
  );
}
