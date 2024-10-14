import { Module } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(
      RabbitMQModule,
      process.env.NODE_ENV !== 'test'
        ? {
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => config.get('rabbitmq'),
            inject: [ConfigService],
          }
        : undefined,
    ),
  ],
  providers: [PoolsService],
  exports: [PoolsService],
})
export class PoolsModule {}
