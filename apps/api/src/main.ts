import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SANAD Platform API (منصة سند)")
    .setDescription("واجهات برمجة التطبيقات لمنصة سند لإدارة الجمعيات الخيرية والمبادرات الفردية والبحث الاجتماعي")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`SANAD API running on http://localhost:${port}/api/v1`);
}
bootstrap();
