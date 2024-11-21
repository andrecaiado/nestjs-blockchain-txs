import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let blockchainServiceMock: Partial<BlockchainService> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        BlockchainService,
        { provide: BlockchainService, useValue: blockchainServiceMock },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
