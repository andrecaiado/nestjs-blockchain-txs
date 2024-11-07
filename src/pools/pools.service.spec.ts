import { Test, TestingModule } from '@nestjs/testing';
import { PoolsService } from './pools.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('PoolsService', () => {
  let service: PoolsService;
  let amqpConnection: Partial<AmqpConnection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsService,
        {
          provide: AmqpConnection,
          useValue: {
            init: jest.fn(),
            channel: jest.fn(),
            connection: jest.fn(),
            managedChannel: jest.fn(),
            managedConnection: jest.fn(),
            configuration: jest.fn(),
            channels: jest.fn(),
            managedChannels: jest.fn(),
            connected: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PoolsService>(PoolsService);
    amqpConnection = module.get<AmqpConnection>(AmqpConnection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(amqpConnection).toBeDefined();
  });
});
