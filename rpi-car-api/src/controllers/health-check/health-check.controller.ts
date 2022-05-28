import {Controller, Get} from '@nestjs/common';
import {HealthCheckService} from "../../services/health-check/health-check.service";

@Controller('health-check')
export class HealthCheckController {
    constructor(private readonly appService: HealthCheckService) {
    }

    @Get()
    getHello(): string {
        return this.appService.getHealthCheck();
    }
}
