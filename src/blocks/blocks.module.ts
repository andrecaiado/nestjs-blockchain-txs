import { forwardRef, Module } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { WalletsModule } from 'src/wallets/wallets.module';

@Module({
  providers: [BlocksService],
  imports: [forwardRef(() => WalletsModule)],
  exports: [BlocksService],
})
export class BlocksModule {}
