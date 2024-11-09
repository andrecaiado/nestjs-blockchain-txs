import { Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  providers: [BlocksService],
  imports: [BlockchainModule, TransactionsModule],
  exports: [BlocksService],
})
export class BlocksModule {}
