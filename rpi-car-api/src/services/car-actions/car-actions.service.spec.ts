import { Test, TestingModule } from '@nestjs/testing';
import { CarActionsService } from './car-actions.service';

describe('CarActionsService', () => {
  let service: CarActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarActionsService],
    }).compile();

    service = module.get<CarActionsService>(CarActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
