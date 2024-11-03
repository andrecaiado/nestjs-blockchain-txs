import { forwardRef, Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  providers: [WalletsService],
  controllers: [WalletsController],
  imports: [forwardRef(() => BlockchainModule)],
  exports: [WalletsService],
})
export class WalletsModule {}
