import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { BlocksModule } from 'src/blocks/blocks.module';
import { WalletsModule } from 'src/wallets/wallets.module';

@Module({
  providers: [MiningService],
  imports: [BlockchainModule, TransactionsModule, BlocksModule, WalletsModule],
})
export class MiningModule {}
