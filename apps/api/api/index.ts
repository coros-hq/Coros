import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import serverlessExpress from '@vendia/serverless-express';
import { Handler, Context, Callback } from 'aws-lambda';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(
  event: any,
  context: Context,
  callback: Callback,
) {
  if (!server) {
    server = await bootstrap();
  }
  return server(event, context, callback);
}