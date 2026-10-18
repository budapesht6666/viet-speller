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

У нас: `AppModule`, `PrismaModule`, `HealthModule`, `UsersModule`,
`AuthModule`, `FamilyModule`, `ProgressModule`, `LeaderboardModule` — по
модулю на предметную область. Модуль импортирует только то, чем
пользуется: `LeaderboardModule` берёт `ProgressModule` ради журнала, а
`AuthModule` — `UsersModule` и `FamilyModule`.

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
общую часть пути, `@Get()` — метод. Контроллер тонкий: принимает DTO,
зовёт сервис, возвращает результат. Логика — в сервисах.

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

## Guard — `CanActivate`, глобальный через `APP_GUARD`

Guard решает, пускать ли запрос в обработчик. Он видит контекст выполнения:
какой контроллер, какой метод, какие у них метаданные.

У нас два, оба глобальные — объявлены провайдером `APP_GUARD`:

- `AuthGuard` (`src/auth/auth.guard.ts`) — проверяет JWT из cookie
  сессии и кладёт `{ id }` в `request.user`. Зарегистрирован в
  `AuthModule`, рядом с собой, как советует документация.
- `ThrottlerGuard` из `@nestjs/throttler` — лимит запросов с адреса
  (`app.module.ts`).

Глобальный guard выбран сознательно: закрыто всё, кроме помеченного
`@Public()`. Забытая пометка закрывает маршрут, а не открывает.

Guard работает до pipes: неавторизованный запрос не доходит даже до
проверки DTO и получает 401, а не 400.

## Декораторы: метаданные и параметр

Свой декоратор — способ сказать фреймворку что-то о маршруте, не меняя
код обработчика.

- `@Public()` (`src/auth/public.decorator.ts`) — `SetMetadata` кладёт
  метку на метод или класс, guard читает её через `Reflector`
  (`getAllAndOverride` — метка на методе важнее метки на классе).
- `@CurrentUser()` (`src/auth/current-user.decorator.ts`) —
  `createParamDecorator`: параметр обработчика, который достаёт id из
  запроса. Контроллеры не лезут в `request.user` руками.
- `@Throttle()` — тот же механизм метаданных, только из библиотеки:
  вход и регистрация затянуты до 10 попыток в минуту.

## DTO и `ValidationPipe`

DTO — класс, описывающий тело запроса декораторами `class-validator`
(`@IsString`, `@Length`, `@IsUUID`…). Глобальный `ValidationPipe`
(`src/setup.ts`) превращает JSON в экземпляр класса и проверяет его до
обработчика. Ошибка — 400 со списком нарушений.

Настройки: `whitelist` выкидывает поля без декораторов,
`forbidNonWhitelisted` превращает их в ошибку — лишнее поле в теле
запроса значит, что клиент и сервер разошлись, и об этом лучше узнать
сразу. `transform` даёт в обработчик экземпляр DTO, а не голый объект.

Массив объектов валидируется только через обёртку: `SyncDto.events` с
`@ValidateNested({ each: true })` и `@Type(() => EventDto)` — TypeScript
не сохраняет тип элементов массива в метаданных, и без `@Type` проверки
элементов не случилось бы вовсе. Поля, нужные одному типу события, —
`@ValidateIf` (`src/progress/progress.dto.ts`).

## Исключения

`ConflictException` (409), `UnauthorizedException` (401),
`NotFoundException` (404) — встроенные HTTP-исключения: брошенное из
сервиса превращается в ответ с кодом и сообщением само. Свой exception
filter не понадобился.

## `JwtModule.registerAsync`

Тот же приём, что `ServeStaticModule.forRootAsync`: секрет берётся из
`ConfigService`, а не из `process.env` при импорте. `JWT_SECRET` в
`.env`, в репозитории — `.env.example`.

## Cookies — `@Res({ passthrough: true })`

`cookie-parser` подключён в `setup.ts` и наполняет `request.cookies`.
Поставить cookie можно только через объект ответа Express, поэтому
`@Res()`. С `passthrough: true` Nest продолжает обрабатывать ответ сам:
возвращённое из метода значение уходит в JSON, как без `@Res()`. Без
`passthrough` ответ пришлось бы отправлять руками.

Сессия — JWT в `httpOnly`-cookie (`src/auth/session.ts`): скрипт
страницы её не прочитает, а фронтенд на том же домене, поэтому CORS не нужен.

## Swagger — `@nestjs/swagger`

Документация API на `/api/docs`. DTO описаны `@ApiProperty` вручную, без
CLI-плагина Swagger: так в коде видно, что попадает в документацию.

## Prisma: миграции

- `npx prisma migrate dev --name <что>` — после правки схемы, создаёт
  SQL в `prisma/migrations/` (коммитится).
- `npx prisma migrate deploy` — накатывает миграции на базу; его же
  вызывает e2e-тест на временной базе, и так миграции проверяются на
  каждом коммите.
- **Prisma 7 после `migrate dev` клиент не генерирует** — `npm run
  generate`, иначе TypeScript не видит новых моделей (`Property 'user'
  does not exist on type 'PrismaService'`).

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
