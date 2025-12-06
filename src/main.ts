import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { seedRoles } from './seeds/roles.seed';
import { seedUsers } from './seeds/users.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  const seedFlag = process.env.SEED_ON_START;
  const shouldSeed = seedFlag ? seedFlag === 'true' : env !== 'production';


  if (shouldSeed) {
    try {
      console.log('Corriendo las seeds antes de la app');
      await seedRoles(app);
      await seedUsers(app);
      console.log('Seeds terminadas o cargadas');
    } catch (error) {
      console.error('Seed tuvo un error al ejecutarse:', error);
    }
  }

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, 
  }));


  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });


  const config = new DocumentBuilder()
    .setTitle('Restaurant API')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();