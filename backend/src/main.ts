import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  app.enableCors({
    origin: [frontendUrl, /https?:\/\/.*\.vercel\.app$/],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Zent API')
    .setDescription('API do Zent (SaaS multi-tenant estilo Notion/Trello)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'x-workspace-id', in: 'header' },
      'workspace-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();

