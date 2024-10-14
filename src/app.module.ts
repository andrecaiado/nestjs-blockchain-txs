import { Module } from '@nestjs/common';
import { WalletsModule } from './wallets/wallets.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { PoolsModule } from './pools/pools.module';

@Module({
  imports: [
    WalletsModule,
    BlockchainModule,
    TransactionsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    PoolsModule,
  ],
})
export class AppModule {}
