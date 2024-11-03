import { forwardRef, Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { WalletsModule } from 'src/wallets/wallets.module';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  providers: [BlocksService],
  imports: [forwardRef(() => WalletsModule), BlockchainModule],
  exports: [BlocksService],
})
export class BlocksModule {}
