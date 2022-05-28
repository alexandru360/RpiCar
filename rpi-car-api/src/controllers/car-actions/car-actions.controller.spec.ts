import { Test, TestingModule } from '@nestjs/testing';
import { CarActionsController } from './car-actions.controller';

describe('CarActionsController', () => {
  let controller: CarActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarActionsController],
    }).compile();

    controller = module.get<CarActionsController>(CarActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
