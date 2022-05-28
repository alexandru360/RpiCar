import { Injectable, Logger } from '@nestjs/common';
import * as Rpio from "rpio";

const logger = new Logger('CarActionsService');

@Injectable()
export class CarActionsService {

    constructor() {}

    public setPinState(pin: number): boolean {
        try {
            Rpio.write(pin, Rpio.HIGH);
            logger.log(`Setting pin ${pin} to HIGH`);
        }catch(e){
            logger.error(`Error setting pin ${pin} to HIGH: ${e}`);
            return false;
        }

        return true;
    }
}
