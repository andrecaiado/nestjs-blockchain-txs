import { Test, TestingModule } from '@nestjs/testing';
import { PoolsService } from './pools.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('PoolsService', () => {
  let service: PoolsService;
  let amqpConnection: Partial<AmqpConnection> = {
    channel: {
      publish: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsService,
        {
          provide: AmqpConnection,
          useValue: amqpConnection,
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

  it('should publish msg', async () => {
    const exchange = 'exchange';
    const message = { key: 'value' };

    await service.publish(exchange, message);

    expect(amqpConnection.channel.publish).toHaveBeenCalledWith(
      exchange,
      '',
      Buffer.from(JSON.stringify(message)),
      {},
    );
  });
});
