import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PoolsService {
  constructor(@Inject() private readonly amqpConnection: AmqpConnection) {}

  public async publish(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<boolean> {
    const data = Buffer.from(JSON.stringify(message));

    console.log(
      `Pools service: publishing message to exchange '${exchange}'...`,
    );

    return new Promise((resolve, reject) => {
      this.amqpConnection.channel.publish(exchange, '', data, {}, (err) => {
        if (err) {
          console.error(
            `Pools service: error publishing message to exchange '${exchange}'.`,
          );
          reject(false);
        } else {
          console.log(
            `Pools service: message published to exchange '${exchange}' successfully.`,
          );
          resolve(true);
        }
      });
    });

    // const result = this.amqpConnection.channel.publish(
    //   exchange,
    //   '',
    //   data,
    //   {},
    //   (err) => {
    //     if (err) {
    //       console.error(
    //         `Pools service: error publishing message to exchange '${exchange}'.`,
    //       );
    //       return false;
    //     } else {
    //       console.log(
    //         `Pools service: message published to exchange '${exchange}' successfully.`,
    //       );
    //       return true;
    //     }
    //   },
    // );

    // return Promise.resolve(result);
  }
}
