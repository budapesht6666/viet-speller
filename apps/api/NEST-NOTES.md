# Заметки по Nest

Бэкенд — учебный проект: на нём владелец осваивает NestJS. Здесь записан
каждый механизм Nest, который появился в коде: что это, где он у нас и
почему здесь именно он. Новый механизм без записи сюда не добавляется.

Версия — **Nest 12**: только ESM (`"type": "module"`), Node ≥ 20. Поэтому
относительные импорты пишутся с `.js` на конце (`./app.module.js`), хотя
файл называется `.ts`: так требует `module: nodenext`, и это не опечатка.

Каркас создан командой `nest new`, модули — `nest g module`,
`nest g service`, `nest g controller`. Генератор сам вписывает новый модуль
в `imports` родителя, поэтому руками это делать не нужно.

## Модуль — `@Module`

Единица сборки приложения: что модуль умеет (`providers`), что отдаёт
наружу (`exports`), какие HTTP-маршруты у него есть (`controllers`) и от
каких модулей он зависит (`imports`). Корень — `AppModule`
(`src/app.module.ts`), из него Nest строит дерево зависимостей.

У нас: `AppModule`, `PrismaModule`, `HealthModule`. Дальше по `PLAN.md`
(этап 6) — `AuthModule`, `FamilyModule`, `ProgressModule`,
`AchievementsModule`, `LeaderboardModule`: по модулю на предметную область.

## Провайдер и внедрение зависимостей — `@Injectable`, конструктор

Провайдер — класс, экземпляр которого создаёт и хранит Nest. Кто его
просит, получает его через параметр конструктора, а не через `new`:
Nest смотрит на тип параметра и подставляет готовый экземпляр. По
умолчанию экземпляр один на приложение.

У нас: `PrismaService` получает `ConfigService`, а `HealthController` —
`PrismaService`. Ни один из них не знает, откуда берётся другой. Поэтому в
тесте любой из них можно подменить, не трогая код.

Тип параметра Nest узнаёт из метаданных декораторов
(`emitDecoratorMetadata` в `tsconfig.json`). Отсюда правило: зависимость
импортируется как значение (`import { PrismaService }`), а не как тип
(`import type`), иначе метаданных не будет и Nest не поймёт, что внедрять.

## Глобальный модуль — `@Global`, `isGlobal: true`

Обычно провайдер модуля виден только тем, кто импортировал модуль. Глобальный
модуль виден всем после одного импорта в корне.

У нас: `PrismaModule` (база нужна почти каждому модулю) и `ConfigModule`
(`isGlobal: true`). Глобальным делаем только то, что нужно действительно
всем: иначе пропадает главное достоинство модулей — по `imports` видно, кто
от чего зависит.

## Динамический модуль — `forRoot`, `forRootAsync`

Модуль, который настраивается при импорте. `forRoot(options)` получает
настройки сразу, `forRootAsync({ useFactory, inject })` — фабрикой, которой
Nest сам передаст нужные провайдеры.

У нас:
- `ConfigModule.forRoot({ isGlobal: true })` читает `.env`;
- `ServeStaticModule.forRootAsync` берёт путь к собранному фронтенду из
  `ConfigService`. Асинхронный вариант нужен, потому что путь — это
  конфигурация, а конфигурация доступна только как провайдер.

## Конфигурация — `@nestjs/config`

`.env` Nest сам не читает. `ConfigModule` загружает его, `ConfigService`
отдаёт значения. `getOrThrow` падает при старте, если переменной нет, —
лучше упасть сразу, чем работать с `undefined` вместо пути к базе.

Переменные — в `.env.example`. Сам `.env` в git не попадает.

## Хуки жизненного цикла — `OnModuleInit`, `OnModuleDestroy`

Методы, которые Nest вызывает при старте и остановке. У нас
`PrismaService` открывает соединение с базой в `onModuleInit` и закрывает в
`onModuleDestroy`.

`onModuleDestroy` на `SIGTERM` вызывается только после
`app.enableShutdownHooks()` (`src/setup.ts`). Без этого `docker stop`
обрывал бы процесс посреди записи в SQLite.

## Prisma как провайдер

Рецепт — https://docs.nestjs.com/data/prisma. `PrismaService` наследует
`PrismaClient`, поэтому в сервисах пишется `this.prisma.user.findMany()`.
Prisma 7 ходит в SQLite через драйвер-адаптер `@prisma/adapter-better-sqlite3`.

Клиент генерируется в `src/generated/prisma` (`npm run generate`) и в git
не попадает. Сборка и тесты генерируют его сами.

Конфиг CLI называется `prisma7.config.ts`, а не `prisma.config.ts`: так его
создаёт `prisma init` начиная с 7.10.

## Контроллер и маршруты — `@Controller`, `@Get`

Контроллер отвечает на HTTP-запросы. `@Controller('health')` задаёт
общую часть пути, `@Get()` — метод. У нас пока один: `HealthController`.

## Глобальный префикс — `setGlobalPrefix`

Всё API живёт под `/api`, кроме `/health` (`exclude`): путь проверки
здоровья у всех приложений на сервере одинаковый, его знает `vps-ops`.

Настройка вынесена в `src/setup.ts` и вызывается и из `main.ts`, и из
e2e-теста — тест проверяет ту же раскладку путей, что прод.

## Проверка здоровья — `@nestjs/terminus`

`TerminusModule` даёт `HealthCheckService` и готовые индикаторы.
`PrismaHealthIndicator.pingCheck` делает `SELECT 1`. `/health` отвечает 200,
только если база открывается: живой процесс с недоступным файлом SQLite —
это сломанное приложение, которое иначе считалось бы рабочим.

## Раздача фронтенда — `@nestjs/serve-static`

Рецепт — https://docs.nestjs.com/recipes/serve-static. Один контейнер, один
домен, cookie без CORS. Из раздачи исключены `/api/{*splat}` и `/health`:
иначе неизвестный путь API вернул бы `index.html` с кодом 200.

## Тесты

Юнит-тесты — `src/**/*.spec.ts`, e2e — `test/**/*.e2e-spec.ts`, оба на
vitest (так генерирует `nest new` в 12-й версии) и оба идут в общий
`npm test` из корня.

**Ловушка.** `Test.createTestingModule().compile()` создаёт провайдеры
раньше, чем у приложения появляется HTTP-адаптер. `ServeStaticModule` в этот
момент выбирает пустой загрузчик и молча ничего не раздаёт — фронтенд
отдаёт 404 только в тесте. Поэтому e2e поднимает приложение через
`NestFactory.create`, как `main.ts`. Для модулей, которым HTTP-адаптер не
нужен, `Test.createTestingModule` остаётся правильным выбором: в нём можно
подменять провайдеры (`overrideProvider`).
