import { Inject, Injectable } from '@nestjs/common';
import { Registry, Counter } from 'prom-client';

@Injectable()
export class MetricsService {
  private totalTxsSubmitted: Counter<string>;
  private totalTxsValidated: Counter<string>;
  private totalTxsRejected: Counter<string>;
  private totalBlocksMined: Counter<string>;
  private totalBlockMiningTime: Counter<string>;
  private totalCoinsMined: Counter<string>;
  private totalCoinsLeftToMine: Counter<string>;
  private totalAddresses: Counter<string>;

  constructor(@Inject(Registry) private readonly registry: Registry) {
    this.totalTxsSubmitted = new Counter({
      name: 'total_txs_submitted',
      help: 'Total number of transactions submitted by wallets',
    });
    this.totalTxsValidated = new Counter({
      name: 'total_txs_validated',
      help: 'Total number of transactions validad',
    });
    this.totalTxsRejected = new Counter({
      name: 'total_txs_rejected',
      help: 'Total number of transactions rejected',
      labelNames: ['error'],
    });
    this.totalBlocksMined = new Counter({
      name: 'total_blocks_mined',
      help: 'Total number of blocks mined',
    });
    this.totalBlockMiningTime = new Counter({
      name: 'total_block_mining_time',
      help: 'Total time spent mining blocks',
    });
    this.totalCoinsMined = new Counter({
      name: 'total_coins_mined',
      help: 'Total number of coins mined',
    });
    this.totalCoinsLeftToMine = new Counter({
      name: 'total_coins_left_to_mine',
      help: 'Total number of coins left to mine',
    });
    this.totalAddresses = new Counter({
      name: 'total_addresses',
      help: 'Total number of addresses in the network',
    });

    this.registry.registerMetric(this.totalTxsSubmitted);
    this.registry.registerMetric(this.totalTxsValidated);
    this.registry.registerMetric(this.totalTxsRejected);
    this.registry.registerMetric(this.totalBlocksMined);
    this.registry.registerMetric(this.totalBlockMiningTime);
    this.registry.registerMetric(this.totalCoinsMined);
    this.registry.registerMetric(this.totalCoinsLeftToMine);
    this.registry.registerMetric(this.totalAddresses);
  }

  incTotalTxsSubmitted(): void {
    this.totalTxsSubmitted.labels().inc();
  }

  incTotalTxsValidated(): void {
    this.totalTxsValidated.labels().inc();
  }

  incTotalTxsRejected(errorMsg: string): void {
    this.totalTxsRejected.labels(errorMsg).inc();
  }

  incTotalBlocksMined(): void {
    this.totalBlocksMined.inc();
  }

  incTotalBlockMiningTime(timeInSeconds: number): void {
    this.totalBlockMiningTime.inc(timeInSeconds);
  }

  incTotalCoinsMined(): void {
    this.totalCoinsMined.inc();
  }

  incTotalCoinsLeftToMine(): void {
    this.totalCoinsLeftToMine.inc();
  }

  incTotalAddresses(): void {
    this.totalAddresses.inc();
  }
}
