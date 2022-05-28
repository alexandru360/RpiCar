import {Inject, Injectable, Logger} from '@nestjs/common';
import * as Rpio from "rpio";
import {ConfigService} from "@nestjs/config";

const logger = new Logger('InitializeCarPinsService');

@Injectable()
export class InitializeCarPinsService {
    @Inject(ConfigService) public config: ConfigService;
    pinState: number = Rpio.LOW;

    constructor() {
        const apiVersion: Array<number> = this.config.get('CAR_SERVO_PINS');
        logger.log(`Initializing car pins: ${apiVersion}`);

        apiVersion.forEach(pin => {
            Rpio.open(pin, Rpio.OUTPUT, this.pinState);
            logger.log(`Car pin ${pin} initialized - ${this.pinState}`);
        });
    }
}
