let server;

async function bootstrap() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../src/app/app.module');
  const serverlessExpress = require('@vendia/serverless-express').default;

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

module.exports = async (req, res) => {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
};