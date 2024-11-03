import { forwardRef, Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlocksModule } from 'src/blocks/blocks.module';

@Module({
  providers: [BlockchainService],
  imports: [forwardRef(() => BlocksModule)],
  exports: [BlockchainService],
})
export class BlockchainModule {}
