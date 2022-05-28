import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {Logger} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";

const logger = new Logger('Main');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const port = await app.get(ConfigService).get("API_PORT") || 5000;

    app.enableCors();
    logger.log('CORS enabled');

    const config = new DocumentBuilder()
        .setTitle('RaspberryPi Car API')
        .setDescription('The car API of your dreams')
        .setVersion('1.0')
        .addTag('rpi-car-api')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);

    await app.listen(port);
    const appUrl = (await app.getUrl()).replace("[::1]", "localhost");
    logger.log(`Api:     ${appUrl}`);
    logger.log(`Swagger: ${appUrl}/swagger`);
}

bootstrap();
