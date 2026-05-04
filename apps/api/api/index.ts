import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import serverlessExpress from '@vendia/serverless-express';

let server: any;

module.exports = async (req: any, res: any) => {
  if (!server) {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    await app.init();
    server = serverlessExpress({ app: app.getHttpAdapter().getInstance() });
  }
  return server(req, res);
};