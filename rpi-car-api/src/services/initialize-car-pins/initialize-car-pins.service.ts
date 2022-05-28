import {Inject, Injectable, Logger} from '@nestjs/common';
import * as Rpio from "rpio";
import {ConfigService} from "@nestjs/config";

const logger = new Logger('InitializeCarPinsService');

@Injectable()
export class InitializeCarPinsService {
    pinState: number = Rpio.LOW;

    constructor(private config: ConfigService) {
        const getPins: string = this.config.get('CAR_SERVO_PINS');
        const apiPins: Array<number> = getPins.split(',').map(Number);
        logger.log(`Initializing car pins: ${apiPins}`);

        for(let pin of apiPins){
            // logger.log(`Selected pin: ${pin}`);
            Rpio.open(pin, Rpio.OUTPUT, this.pinState);
            logger.log(`Car pin ${pin} initialized - ${this.pinState}`);
        };
    }
}
