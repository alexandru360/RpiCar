import { Injectable, Logger } from '@nestjs/common';
import * as Rpio from "rpio";
import { ConfigService } from "@nestjs/config";

const logger = new Logger('InitializeCarPinsService');

@Injectable()
export class InitializeCarPinsService {
    pinState: number = Rpio.LOW;

    constructor(private config: ConfigService) {
        const getPins: string = this.config.get('CAR_SERVO_PINS');
        const apiPins: Array<number> = getPins.split(',').map(Number);
        logger.log(`Initializing car pins: ${apiPins}`);

        Rpio.init({ gpiomem: true });

        // Rpio.init({
        //     gpiomem: true,          /* Use /dev/gpiomem */
        //     mapping: 'physical',    /* Use the P1-P40 numbering scheme */
        //     mock: undefined,        /* Emulate specific hardware in mock mode */
        //     close_on_exit: true,    /* On node process exit automatically close rpio */
        // });

        for (let pin of apiPins) {
            // logger.log(`Selected pin: ${pin}`);
            Rpio.open(pin, Rpio.OUTPUT, this.pinState);
            logger.log(`Car pin ${pin} initialized - ${this.pinState}`);
        };
    }
}
