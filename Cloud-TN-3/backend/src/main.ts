import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));

  const origins = (configService.get<string>('cors.allowedOrigins') ?? '').split(',').filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : undefined,
    credentials: true,
  });

  await app.get(AuthService).seedOwnerIfNeeded();

  const port = configService.get<number>('app.port') ?? 8080;
  await app.listen(port);
  const url = await app.getUrl();
  Logger.log(`Teknav backend listening on ${url}`, 'Bootstrap');
}

bootstrap();
