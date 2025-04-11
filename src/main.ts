import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  Logger,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { exceptionFactory } from './libs/exception/exception-factory';

/**
 * Copy/Paste the code from benefis2. Because benefis2 become standard for dd project.
 *
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       directives: {
  //         defaultSrc: ["'self'"],
  //         scriptSrc: ["'self'"],
  //         styleSrc: ["'self'", 'https:', 'data:'],
  //         imgSrc: ["'self'", 'data:', 'https:'],
  //         connectSrc: ["'self'"],
  //         frameSrc: ["'none'"],
  //         objectSrc: ["'none'"],
  //       },
  //     },
  //   }),
  // );
  app.enableCors();
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX, {
    exclude: [
      { path: 'cb/(.*)', method: RequestMethod.ALL },
      { path: 'version', method: RequestMethod.ALL },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory,
    }),
  );

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Attend Smart Admin')
      .setDescription('No description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH, app, document);
  }

  await app.listen(process.env.PORT);
  Logger.log(
    `Running on: ${
      process.env.NODE_ENV === 'development'
        ? `http://127.0.0.1:${process.env.PORT}`
        : await app.getUrl()
    }/${process.env.GLOBAL_PREFIX}`,
    'Application',
  );
}
bootstrap();
