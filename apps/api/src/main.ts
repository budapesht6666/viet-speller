import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setup } from './setup.js';

async function bootstrap() {
  const app = setup(await NestFactory.create(AppModule));
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
