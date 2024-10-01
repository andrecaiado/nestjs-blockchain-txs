import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
  imports: [BlockchainModule],
})
export class TransactionsModule {}
