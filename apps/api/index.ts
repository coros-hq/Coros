import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app/app.module';
import serverlessExpress from '@vendia/serverless-express';

let server: any;

export default async function handler(req: any, res: any) {
  if (!server) {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // allow your webapp to connect
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    server = serverlessExpress({ app: expressApp });
  }
  return server(req, res);
}