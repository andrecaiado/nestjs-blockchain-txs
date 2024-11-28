import { Inject, Injectable } from '@nestjs/common';
import { Registry, Counter } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly totalTxsSubmitted: Counter<string>;
  private readonly totalTxsAccepted: Counter<string>;
  private readonly totalTxsRejected: Counter<string>;

  constructor(@Inject(Registry) private readonly registry: Registry) {
    this.totalTxsSubmitted = new Counter({
      name: 'total_txs_submitted',
      help: 'Total number of transactions submitted by wallets',
      //labelNames: ['method', 'status_code'],
    });
    this.totalTxsAccepted = new Counter({
      name: 'total_txs_accepted',
      help: 'Total number of transactions accepted by the blockchain',
    });
    this.totalTxsRejected = new Counter({
      name: 'total_txs_rejected',
      help: 'Total number of transactions rejected by the blockchain',
    });

    this.registry.registerMetric(this.totalTxsSubmitted);
    this.registry.registerMetric(this.totalTxsAccepted);
    this.registry.registerMetric(this.totalTxsRejected);
  }

  incTotalTxsSubmitted(): void {
    this.totalTxsSubmitted.labels().inc();
  }

  incTotalTxsAccepted(): void {
    this.totalTxsAccepted.labels().inc();
  }

  incTotalTxsRejected(): void {
    this.totalTxsRejected.labels().inc();
  }
}
