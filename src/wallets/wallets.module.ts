import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  providers: [WalletsService],
  controllers: [WalletsController],
  imports: [BlockchainModule],
})
export class WalletsModule {}
