import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiKeyGuard } from './app/guards/api-key.guard';
import { Reflector } from '@nestjs/core';
// import { HttpExceptionFilter } from './app/http-exception.filter'; // You'll create this
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global CORS
  app.enableCors({
    origin: '*', // Adjust as needed
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  
  const config = new DocumentBuilder()
    .setTitle('Recruit Hub Core API')
    .setDescription('Core Backend System of RecruitHub Portal')
    .setVersion('0.0.1')
    .addBearerAuth() // Add Bearer auth to Swagger
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  
  // Apply the API key guard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new ApiKeyGuard(reflector));

  // Enhanced validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  

  // Global exception filter (optional but recommended)
  // app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.CORE_API_PORT || 8000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
