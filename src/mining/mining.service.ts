import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { Block } from 'src/blocks/block';
import { BlocksService } from 'src/blocks/blocks.service';
import { TransactionDtoMapper } from 'src/transactions/dto/mappers/transaction.mapper';
import { TransactionDto } from 'src/transactions/dto/transaction.dto';
import { Transaction } from 'src/transactions/transaction';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class MiningService {
  constructor(
    @Inject() private blockchainService: BlockchainService,
    @Inject() private transactionsService: TransactionsService,
    @Inject() private blocksService: BlocksService,
  ) {}

  @RabbitSubscribe({
    queue: 'miner-mempool-queue',
  })
  public async mempoolTxsHandler(msg: object): Promise<Block> {
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
    let block = this.blocksService.createBlock([transaction]);

    // Mine block
    block = this.mineBlock(block);

    // Broadcast mined block

    // Delete msgs from queue
    // I believe they are instantly deleted by default...
    // Remove this step from the process?

    console.log(`Mining service: Block mined`);

    return block;
  }

  private mineBlock(block: Block): Block {
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
