import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { MetricsService } from 'src/metrics/metrics.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: Partial<TransactionsService>;
  let metricsService: Partial<MetricsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        BlockchainService,
        ConfigService,
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
