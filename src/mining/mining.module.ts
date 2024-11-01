import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  providers: [MiningService],
  imports: [BlockchainModule, TransactionsModule],
})
export class MiningModule {}
