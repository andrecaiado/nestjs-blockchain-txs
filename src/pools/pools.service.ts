import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PoolsService {
  constructor(@Inject() private readonly amqpConnection: AmqpConnection) {}

  public async publish(exchange: string, message: any): Promise<void> {
    console.log(
      `Pools service: Publishing message to exchange '${exchange}'...`,
    );

    const data = Buffer.from(JSON.stringify(message));
    this.amqpConnection.channel.publish(exchange, '', data, {});

    console.log(`Pools service: Message published to exchange '${exchange}'.`);
  }
}
