import { forwardRef, Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { PoolsModule } from 'src/pools/pools.module';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
  imports: [
    BlockchainModule,
    forwardRef(() => WalletsModule),
    PoolsModule,
    MetricsModule,
  ],
})
export class TransactionsModule {}
