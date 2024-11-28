import { Module } from '@nestjs/common';
import { WalletsModule } from './wallets/wallets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { PoolsModule } from './pools/pools.module';
import { MiningModule } from './mining/mining.module';
import { BlocksModule } from './blocks/blocks.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    PrometheusModule.register(),
    WalletsModule,
    BlockchainModule,
    TransactionsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    PoolsModule,
    MiningModule,
    BlocksModule,
    MetricsModule,
  ],
})
export class AppModule {}
