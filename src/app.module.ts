import { Module } from '@nestjs/common';
import { WalletsModule } from './wallets/wallets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BlockchainService } from './blockchain/blockchain.service';

@Module({
  imports: [WalletsModule, BlockchainModule, TransactionsModule],
  providers: [BlockchainService],
})
export class AppModule {}
