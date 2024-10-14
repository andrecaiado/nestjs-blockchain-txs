import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { WalletsModule } from 'src/wallets/wallets.module';
import { PoolsModule } from 'src/pools/pools.module';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
  imports: [BlockchainModule, WalletsModule, PoolsModule],
})
export class TransactionsModule {}
