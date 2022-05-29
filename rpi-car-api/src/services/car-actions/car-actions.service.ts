import { Injectable, Logger } from '@nestjs/common';
import * as Rpio from "rpio";

const logger = new Logger('CarActionsService');

@Injectable()
export class CarActionsService {

    constructor() { }

    public setPinState(pin: number): boolean {
        try {
            Rpio.write(pin, Rpio.HIGH);
            logger.log(`Setting pin ${pin} to HIGH`);
        } catch (e) {
            logger.error(`Error setting pin ${pin} to HIGH: ${e}`);
            return false;
        }

        return true;
    }

    public closePin(pin: number): boolean {
        try {
            Rpio.write(pin, Rpio.LOW);
            // Rpio.close(pin);
            logger.log(`Closing pin ${pin}`);
        } catch (e) {
            logger.error(`Error closing pin ${pin}: ${e}`);
            return false;
        }

        return true;
    }

    public pwmWithOnePin(): boolean {
        try {
            const pin = 12;           /* P12/GPIO18 */
            const range = 1024;       /* LEDs can quickly hit max brightness, so only use */
            const max = 128;          /*   the bottom 8th of a larger scale */
            const clockdiv = 8;       /* Clock divider (PWM refresh rate), 8 == 2.4MHz */
            const interval = 5;       /* setInterval timer, speed of pulses */
            let times = 5;          /* How many times to pulse before exiting */

            logger.log("Enable PWM on the chosen pin and set the clock and range.");
            Rpio.open(pin, Rpio.PWM);
            Rpio.pwmSetClockDivider(clockdiv);
            Rpio.pwmSetRange(pin, range);

            logger.log("Repeatedly pulse from low to high and back again until times runs out.");
            let direction = 1;
            let data = 0;
            const pulse = setInterval(() => {
                Rpio.pwmSetData(pin, data);
                if (data === 0) {
                    direction = 1;
                    if (times-- === 0) {
                        clearInterval(pulse);
                        Rpio.open(pin, Rpio.INPUT);
                        return;
                    }
                } else if (data === max) {
                    direction = -1;
                }
                data += direction;
            }, interval, data, direction, times);
            logger.log(`Closing pin ${pin}`);
        } catch (e) {
            logger.error(`Error: ${e}`);
            return false;
        }

        return true;
    }
}
