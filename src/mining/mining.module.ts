import { Module } from '@nestjs/common';
import { MiningService } from './mining.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { Block } from 'src/blocks/block';
import { BlocksModule } from 'src/blocks/blocks.module';

@Module({
  providers: [MiningService],
  imports: [BlockchainModule, TransactionsModule, BlocksModule],
})
export class MiningModule {}
