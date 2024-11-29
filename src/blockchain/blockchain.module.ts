import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
  controllers: [BlockchainController],
  imports: [ScheduleModule.forRoot(), MetricsModule],
})
export class BlockchainModule {}
