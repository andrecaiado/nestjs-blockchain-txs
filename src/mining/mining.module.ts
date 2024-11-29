import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { BlocksModule } from 'src/blocks/blocks.module';
import { PoolsModule } from 'src/pools/pools.module';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  providers: [MiningService],
  imports: [
    BlockchainModule,
    TransactionsModule,
    BlocksModule,
    WalletsModule,
    PoolsModule,
    MetricsModule,
  ],
  exports: [MiningService],
})
export class MiningModule {}
