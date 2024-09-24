import { Module } from '@nestjs/common';
import { WalletsModule } from './wallets/wallets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [WalletsModule, BlockchainModule, TransactionsModule],
})
export class AppModule {}
