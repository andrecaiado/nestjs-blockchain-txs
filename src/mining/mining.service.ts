import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { Block } from 'src/blocks/block';
import { BlocksService } from 'src/blocks/blocks.service';
import { TransactionDtoMapper } from 'src/transactions/dto/mappers/transaction.mapper';
import { TransactionDto } from 'src/transactions/dto/transaction.dto';
import { Transaction } from 'src/transactions/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';
//import { createHash } from 'node:crypto';
import { WalletsService } from 'src/wallets/wallets.service';
import { PoolsService } from 'src/pools/pools.service';

@Injectable()
export class MiningService {
  constructor(
    @Inject() private blockchainService: BlockchainService,
    @Inject() private transactionsService: TransactionsService,
    @Inject() private blocksService: BlocksService,
    @Inject() private configService: ConfigService,
    @Inject() private walletsService: WalletsService,
    @Inject() private poolsService: PoolsService,
  ) {}

  @RabbitSubscribe({
    queue: 'miner-mempool-queue',
  })
  public async mempoolTxsHandler(msg: object): Promise<Block> {
    // Get a random wallet to use as the miner's wallet
    const minerWallet = this.walletsService.getRandomWallet();

    console.log(
      `Mining service: Received new transaction ${JSON.stringify(msg)}`,
    );

    // Map msg to Transaction model
    let transaction: Transaction = null;
    try {
      transaction = TransactionDtoMapper.toTransaction(msg as TransactionDto);
    } catch (error) {
      console.log(
        'Mining service: Error mapping message to transaction, transaction discarded.',
      );
      return;
    }

    // Validate transaction: are UTXOs still unspent?
    if (!this.validateTransaction(transaction)) {
      console.error(
        `Mining service: Transaction ${transaction.transactionId}: there are UTXOs that are not unspent, transaction discarded.`,
      );
      return;
    }

    // Create new block
    let block = this.blocksService.createBlock([transaction], minerWallet);

    // Mine block
    block = this.mineBlock(block);

    // Broadcast mined block
    this.poolsService.publish(
      this.configService.get<string>('rabbitmq.exchanges[1].name'),
      block,
    );

    // Delete msgs from queue
    // I believe they are instantly deleted by default...
    // Remove this step from the process?
    return block;
  }

  public mineBlock(block: Block): Block {
    const startTime = process.hrtime();
    console.log(`Mining service: Mining block #${block.id}...`);
    const difficulty = this.configService.get<number>(
      'blockchain.miningDifficulty',
    );
    const blockHashPrefix = '0'.repeat(difficulty);
    let blockHash: string = '';
    let nonce: number = 0;
    while (!blockHash.startsWith(blockHashPrefix)) {
      block.nonce = nonce;
      blockHash = block.calculateHash(); //createHash('sha256').update(block.toString()).digest('hex');
      nonce++;
    }
    block.hash = blockHash;
    const endTime = process.hrtime(startTime);
    const duration = endTime[0] + endTime[1] / Math.pow(10, 9);
    console.log(
      `Mining service: Block #${block.id} mined in ${duration} seconds`,
    );
    return block;
  }

  private validateTransaction(transaction: Transaction): boolean {
    const walletUTXOs = this.blockchainService.getWalletUTXOs(
      transaction.senderPublicKey,
    );

    return this.transactionsService.verifyUTXOsAreUnspent(
      transaction.inputs.map((input) => input.UTXO),
      walletUTXOs,
    );
  }
}
