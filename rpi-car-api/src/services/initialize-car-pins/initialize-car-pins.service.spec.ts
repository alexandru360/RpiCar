import { Test, TestingModule } from '@nestjs/testing';
import { InitializeCarPinsService } from './initialize-car-pins.service';

describe('InitializeCarPinsService', () => {
  let service: InitializeCarPinsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitializeCarPinsService],
    }).compile();

    service = module.get<InitializeCarPinsService>(InitializeCarPinsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
