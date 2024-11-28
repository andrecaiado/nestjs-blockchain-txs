import { forwardRef, Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  providers: [WalletsService],
  controllers: [WalletsController],
  imports: [
    forwardRef(() => BlockchainModule),
    forwardRef(() => TransactionsModule),
    MetricsModule,
  ],
  exports: [WalletsService],
})
export class WalletsModule {}
