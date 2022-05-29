import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import PinDto from 'src/common/dtos/pin-dto';
import { CarActionsService } from 'src/services/car-actions/car-actions.service';

@Controller('car-actions')
export class CarActionsController {
    constructor(private readonly service: CarActionsService) {
    }

    @Post("set-pin-state")
    setPinState(@Body() par:PinDto): boolean {
        console.log("pin:PinDto", par);
        return this.service.setPinState(par.pin);
    }

    @Post("close-pin")
    closePin(@Body() par:PinDto): boolean {
        console.log("pin:PinDto", par);
        return this.service.closePin(par.pin);
    }

    @Get("pwm-pin-12")
    pwmWithOnePin(): boolean {
        return this.service.pwmWithOnePin();
    }
}
