import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block } from './block';
import { Transaction } from 'src/transactions/transaction';
import { Wallet } from 'src/wallets/wallet';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class BlocksService {
  constructor(
    @Inject() private configService: ConfigService,
    @Inject() private blockchainService: BlockchainService,
    @Inject() private transactionsService: TransactionsService,
    @Inject() private metricsService: MetricsService,
  ) {
    console.log('Blocks service: Creating genesis block...');
    const genesisBlock = this.createGenesisBlock();
    console.log('Blocks service: Done. The genesis block was created!');
    this.blockchainService.addGenesisBlock(genesisBlock);
  }

  public createGenesisBlock() {
    const hash = this.configService.get<string>('blockchain.genesisBlock.hash');
    const data = this.configService.get<string>('blockchain.genesisBlock.data');

    const transaction = this.transactionsService.createGenesisTransaction();
    const genesisBlock = new Block();
    genesisBlock.id = 0;
    genesisBlock.transactions = [transaction];
    genesisBlock.hash = hash;
    genesisBlock.previousHash = '0';
    genesisBlock.nonce = 0;
    genesisBlock.timestamp = new Date().getTime();
    genesisBlock.data = data;

    return genesisBlock;
  }

  public createBlock(transactions: Transaction[], minerWallet: Wallet): Block {
    console.log(`Blocks service: Creating new block ...`);
    const previousBlock = this.blockchainService.getLastBlock();
    const lastBlockId = previousBlock.id;
    const previousHash = previousBlock.hash;
    const transactionFees = transactions.reduce(
      (feeAcc, tx) => feeAcc + tx.transactionFees,
      0,
    );

    const coinbaseTransaction =
      this.transactionsService.createCoinbaseTransaction(
        minerWallet,
        transactionFees,
      );
    transactions.unshift(coinbaseTransaction);

    const newBlock: Block = new Block();
    newBlock.id = lastBlockId + 1;
    newBlock.transactions = [...transactions];
    newBlock.hash = '';
    newBlock.previousHash = previousHash;
    newBlock.nonce = 0;
    newBlock.timestamp = new Date().getTime();
    newBlock.data = '';

    console.log(
      `Blocks service: Created new block with ${transactions.length} transaction(s).`,
    );

    return newBlock;
  }
}
