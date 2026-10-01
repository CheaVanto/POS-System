import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  // Allow uploaded images to be embedded by the web app on a different origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const allowlist = config.get<string[]>('corsOrigins') ?? [];
  // Any localhost origin (localhost / 127.0.0.1 / [::1], any port) is allowed in dev.
  const localhostRe = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowlist.includes(origin) || localhostRe.test(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise POS API')
    .setDescription('POS backend')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('port')!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`POS API on http://localhost:${port}/api  (docs: /api/docs)`);
}

bootstrap();
