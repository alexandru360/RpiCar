import { Body, Controller, Post } from '@nestjs/common';
import { CarActionsService } from 'src/services/car-actions/car-actions.service';

@Controller('car-actions')
export class CarActionsController {
    constructor(private readonly service: CarActionsService) {
    }

    @Post()
    setPinState(@Body() pinNumber: PinDto): boolean {
        return this.service.setPinState(pinNumber);
    }
}
