import { Inject, Injectable } from '@nestjs/common';
import { Registry, Counter, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private totalTxsInBlockchain: Counter<string>;
  private totalTxsRejected: Counter<string>;
  private totalBlocks: Counter<string>;
  private totalBlocksMined: Counter<string>;
  private totalBlockMiningTime: Counter<string>;
  private totalBlocksRejected: Counter<string>;
  private totalCoinsMined: Counter<string>;
  private totalCoinsLeftToMine: Counter<string>;
  private totalAddresses: Counter<string>;
  private totalCoinsTransfered: Counter<string>;
  private blockchainStatus: Gauge<string>;
  private totalMiningRewards: Counter<string>;

  constructor(@Inject(Registry) private readonly registry: Registry) {
    this.totalTxsInBlockchain = new Counter({
      name: 'total_txs_in_blockchain',
      help: 'Total number of transactions in the blockchain',
    });
    this.totalTxsRejected = new Counter({
      name: 'total_txs_rejected',
      help: 'Total number of transactions rejected',
      labelNames: ['error'],
    });
    this.totalBlocks = new Counter({
      name: 'total_blocks',
      help: 'Total number of blocks',
    });
    this.totalBlocksMined = new Counter({
      name: 'total_blocks_mined',
      help: 'Total number of blocks mined',
    });
    this.totalBlockMiningTime = new Counter({
      name: 'total_block_mining_time',
      help: 'Total time spent mining blocks',
    });
    this.totalBlocksRejected = new Counter({
      name: 'total_blocks_rejected',
      help: 'Total number of blocks rejected',
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
    this.totalCoinsTransfered = new Counter({
      name: 'total_coins_transfered',
      help: 'Total coins transfered from wallets',
    });
    this.blockchainStatus = new Gauge({
      name: 'blockchain_status',
      help: 'Is the blockchain valid or not',
    });
    this.totalMiningRewards = new Counter({
      name: 'total_mining_rewards',
      help: 'Total coins awarded to miners',
    });

    this.registry.registerMetric(this.totalTxsInBlockchain);
    this.registry.registerMetric(this.totalTxsRejected);
    this.registry.registerMetric(this.totalBlocks);
    this.registry.registerMetric(this.totalBlocksMined);
    this.registry.registerMetric(this.totalBlockMiningTime);
    this.registry.registerMetric(this.totalBlocksRejected);
    this.registry.registerMetric(this.totalCoinsMined);
    this.registry.registerMetric(this.totalCoinsLeftToMine);
    this.registry.registerMetric(this.totalAddresses);
    this.registry.registerMetric(this.totalCoinsTransfered);
    this.registry.registerMetric(this.blockchainStatus);
    this.registry.registerMetric(this.totalMiningRewards);
  }

  setTotalTxsInBlockchain(total: number): void {
    this.totalTxsInBlockchain.reset();
    this.totalTxsInBlockchain.inc(total);
  }

  incTotalTxsRejected(errorMsg: string): void {
    this.totalTxsRejected.labels(errorMsg).inc();
  }

  setTotalBlocks(total: number): void {
    this.totalBlocks.reset();
    this.totalBlocks.inc(total);
  }

  incTotalBlocksMined(): void {
    this.totalBlocksMined.inc();
  }

  incTotalBlockMiningTime(timeInSeconds: number): void {
    this.totalBlockMiningTime.inc(timeInSeconds);
  }

  incTotalBlocksRejected(): void {
    this.totalBlocksRejected.inc();
  }

  setTotalCoinsMined(coinsMined: number): void {
    this.totalCoinsMined.reset();
    this.totalCoinsMined.inc(coinsMined);
  }

  setTotalCoinsLeftToMine(coinsLeftToMine: number): void {
    this.totalCoinsLeftToMine.reset();
    this.totalCoinsLeftToMine.inc(coinsLeftToMine);
  }

  setTotalAddresses(totalAddresses: number): void {
    this.totalAddresses.reset();
    this.totalAddresses.inc(totalAddresses);
  }

  incTotalCoinsTransfered(coinsTransfered: number): void {
    this.totalCoinsTransfered.inc(coinsTransfered);
  }

  setBlockchainStatus(isValid: boolean): void {
    const status = isValid ? 1 : 0;
    this.blockchainStatus.set(status);
  }

  incTotalMinningRewards(total: number): void {
    this.totalMiningRewards.inc(total);
  }
}
