import {Logger, MiddlewareConsumer, Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {getEnvPath} from './common/helper/env.helper';
import LogsMiddleware from "./middleware/logs.middleware";
import {ServeStaticModule} from "@nestjs/serve-static";
import {join} from 'path';
import {InitializeCarPinsService} from './services/initialize-car-pins/initialize-car-pins.service';
import {HealthCheckService} from './services/health-check/health-check.service';
import {HealthCheckController} from './controllers/health-check/health-check.controller';
import { CarActionsService } from './services/car-actions/car-actions.service';
import { CarActionsController } from './controllers/car-actions/car-actions.controller';

const logger = new Logger('AppModule');

const envFilePath: string = getEnvPath(`${__dirname}/common/envs`);
logger.log(`Using env file: ${envFilePath}`);

const staticPath = join(__dirname, '..', '..', 'rpi-car-ui', 'public');
logger.log(`Using static dir path: ${staticPath}`);

@Module({
    imports: [
        ConfigModule.forRoot({envFilePath, isGlobal: true}),
        ServeStaticModule.forRoot({rootPath: staticPath}),
    ],
    controllers: [
        HealthCheckController,
        CarActionsController
    ],
    providers: [
        InitializeCarPinsService,
        HealthCheckService,
        CarActionsService
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogsMiddleware).forRoutes('*');
    }
}
