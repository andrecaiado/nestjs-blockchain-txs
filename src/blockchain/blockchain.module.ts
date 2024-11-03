import { forwardRef, Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlocksModule } from 'src/blocks/blocks.module';

@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
