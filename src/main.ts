import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import cookieParser from 'cookie-parser';
import { corsConfig } from '../configs/cors.config';
import { validationConfig } from '../configs/validation.config';
import { ResponseFormatInterceptor } from '../common/interceptor/response-format.interceptor';
import { AllExceptionFilter } from '../common/filter/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Needed when running behind a reverse proxy (e.g., Render) so
  // secure-cookie / protocol-related behavior is consistent.
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.use(cookieParser());
  app.enableCors(corsConfig);
  app.useGlobalPipes(new ValidationPipe(validationConfig));
  app.useGlobalInterceptors(new ResponseFormatInterceptor());
  app.useGlobalFilters(new AllExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
