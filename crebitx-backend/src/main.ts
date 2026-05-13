import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from '@/common/services/logger.service';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get configuration
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3002'),
    credentials: configService.get('CORS_CREDENTIALS', true),
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'CREBITX API'))
    .setDescription(
      configService.get('SWAGGER_DESCRIPTION', 'Multi-tenant SaaS API Documentation'),
    )
    .setVersion(configService.get('SWAGGER_VERSION', '1.0'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerPath = configService.get('SWAGGER_PATH', 'api/docs');
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server
  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 CREBITX Backend is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`📚 API Documentation: http://localhost:${port}/${swaggerPath}`, 'Bootstrap');
}

bootstrap();
