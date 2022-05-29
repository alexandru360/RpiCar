import { Body, Controller, Delete, Post } from '@nestjs/common';
import PinDto from 'src/common/dtos/pin-dto';
import { CarActionsService } from 'src/services/car-actions/car-actions.service';

@Controller('car-actions')
export class CarActionsController {
    constructor(private readonly service: CarActionsService) {
    }

    @Post()
    setPinState(@Body() par:PinDto): boolean {
        console.log("pin:PinDto", par);
        return this.service.setPinState(par.pin);
    }

    @Delete()
    closePin(@Body() par:PinDto): boolean {
        console.log("pin:PinDto", par);
        return this.service.closePin(par.pin);
    }
}
