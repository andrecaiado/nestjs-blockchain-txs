import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { Registry } from 'prom-client';

describe('MetricsService', () => {
  let service: MetricsService;
  let registryMock: Partial<Registry> = {
    registerMetric: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: Registry, useValue: registryMock },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    registryMock = module.get<Registry>(Registry);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
