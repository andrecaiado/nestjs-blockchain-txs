import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { TransactionsService } from 'src/transactions/transactions.service';

describe('WalletsController', () => {
  let controller: WalletsController;
  let walletsServiceMock: Partial<WalletsService> = {};
  let transactionsServiceMock: Partial<TransactionsService> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: WalletsService, useValue: walletsServiceMock },
        { provide: TransactionsService, useValue: transactionsServiceMock },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    walletsServiceMock = module.get<WalletsService>(WalletsService);
    transactionsServiceMock =
      module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(walletsServiceMock).toBeDefined();
  });
});
