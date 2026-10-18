/**
 * Все строки интерфейса. Интерфейс только на русском, слоя i18n нет, но строки
 * всё равно здесь, а не в разметке: так их не ищут по компонентам, а пустую
 * ловит тест.
 *
 * Вьетнамского текста здесь нет: он — контент и живёт в packages/content.
 */

export const strings = {
  appName: 'Viet Speller',
  'home.lead': 'Вьетнамский с нуля — для тех, кто уже живёт во Вьетнаме.',
  'home.continue': 'Продолжить',
  'home.start': 'Начать первый урок',
  'home.allDone': 'Все уроки пройдены. Новые темы — скоро.',
  'home.review': 'Тренировка',
  'home.reviewDue': 'Пора повторить',
  'home.reviewNone': 'Повторять пока нечего — пройди урок',
  'home.path': 'Путь',
  'home.lessonDone': 'пройден',
  'home.lessonLocked': 'откроется после предыдущего',
  'home.phrasebook': 'Разговорник',
  'home.family': 'Семья',

  'stats.streak': 'дней подряд',
  'stats.today': 'мин сегодня',
  'stats.goal': 'цель',
  'stats.week': 'мин за неделю',

  'noMic.on': 'Не могу говорить',
  'noMic.active': 'Без микрофона ещё',
  'noMic.off': 'Снова говорить',
  'noMic.hint': 'На 15 минут — только упражнения на слух и касания.',

  'status.title': 'Что работает сейчас',
  'speech.ok': 'Распознавание речи доступно',
  'speech.insecure': 'Распознавание недоступно: страница открыта по http. Нужен https',
  'speech.unsupported': 'Этот браузер не умеет распознавать речь. Упражнения на слух работают',
  'net.online': 'Есть сеть',
  'net.offline': 'Нет сети: распознавание не работает, разговорник — работает',
  'storage.idb': 'Прогресс сохраняется на телефоне',
  'storage.memory': 'Прогресс не сохранится: браузер запретил хранилище (приватный режим?)',
  'storage.pending': 'Открываю хранилище…',
  'app.offlineReady': 'Приложение сохранено и откроется без сети',
  'app.updateReady': 'Вышло обновление',
  'app.update': 'Обновить',
  'app.updating': 'Обновляю…',
  'app.swError': 'Не удалось сохранить приложение для работы без сети',
  'app.swPending': 'Сохраняю приложение для работы без сети…',

  'lesson.close': 'Закрыть урок',
  'lesson.next': 'Дальше',
  'lesson.check': 'Проверить',
  'lesson.skip': 'Не могу сказать',
  'lesson.play': 'Послушать',
  'lesson.slow': 'Медленно',
  'lesson.listen': 'Послушай',
  'lesson.repeat': 'Послушай и повтори',
  'lesson.say': 'Скажи по-вьетнамски',
  'lesson.hear': 'Что ты услышал?',
  'lesson.meaning': 'Что это значит?',
  'lesson.build': 'Собери фразу',
  'lesson.tone': 'Какой тон?',
  'lesson.speak': 'Сказать',
  'lesson.speaking': 'Слушаю…',
  'lesson.starting': 'Включаю микрофон…',
  'lesson.notHeard': 'Не расслышал. Послушай образец и скажи ещё раз',
  'lesson.blocked': 'Микрофон запрещён. Разрешить: Настройки → Safari → Микрофон',
  'lesson.offline': 'Нет сети — распознаванию она нужна',
  'lesson.micError': 'Микрофон не включился',
  'lesson.withoutMic': 'Дальше без микрофона',
  'lesson.noMicNote': 'Урок без микрофона',
  'lesson.clear': 'Сбросить',
  'lesson.audioMissing': 'Нет записи для этого слова',
  'lesson.audioFailed': 'Запись не загрузилась — проверь сеть и нажми ещё раз',
  'lesson.audioBlocked': 'Браузер не дал воспроизвести звук — нажми «Послушать»',

  'verdict.success': 'Верно',
  'verdict.almost': 'Почти — засчитано',
  'verdict.miss': 'Не засчитано',
  'verdict.answer': 'Правильно:',
  'verdict.heard': 'Услышано:',

  'done.lesson': 'Урок пройден',
  'done.review': 'Тренировка закончена',
  'done.accuracy': 'верных ответов',
  'done.minutes': 'минут',
  'done.items': 'слов и фраз',
  'done.home': 'На главную',
  'done.saveFailed': 'Не удалось сохранить итог на телефоне',

  'dialect.north': 'на Севере',
  'dialect.south': 'на Юге',
  'dialect.center': 'в Центре',
} as const;

export type StringKey = keyof typeof strings;

export const t = (key: StringKey): string => strings[key];
