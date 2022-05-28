import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class HealthCheckService {
    @Inject(ConfigService) public config: ConfigService;

    public getHealthCheck(): string {
        const apiVersion = this.config.get('API_VER');
        const apiEnv: string = this.config.get('API_ENV');
        return `Car api is healthy - ver: ${apiVersion} - env: ${apiEnv}`;
    }
}
