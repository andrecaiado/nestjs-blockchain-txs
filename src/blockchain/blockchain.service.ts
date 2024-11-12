import { Injectable } from '@nestjs/common';
import { Blockchain } from './blockchain';
import { TransactionOutput } from 'src/transactions/transaction';
import { Block } from 'src/blocks/block';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BlockDto } from 'src/blocks/dto/block.dto';
import { BlockDtoMapper } from 'src/blocks/dto/mappers/block.dto.mapper';

@Injectable()
export class BlockchainService {
  private blockchain: Blockchain;

  constructor() {
    console.log('Blockchain service: Creating blockchain...');
    this.blockchain = new Blockchain();
    console.log('Blockchain service: Blockchain created!');
  }

  public getBlockchain() {
    return this.blockchain;
  }

  public getWalletUTXOs(walletPublicKey: string): TransactionOutput[] {
    // This is mocked data.
    const txo = new TransactionOutput();
    txo.amount = 100.54;
    txo.id = '123';
    txo.parentTransactionId = '123';
    txo.recipientPublicKey = walletPublicKey;
    return [txo];
  }

  public addGenesisBlock(genesisBlock: Block) {
    console.log(
      'Blockchain service: Adding genesis block to the blockchain...',
    );
    this.blockchain.chain.push(genesisBlock);
    console.log('Blockchain service: Genesis block added to the blockchain.');
  }

  public getLastBlock() {
    return this.blockchain.chain[this.blockchain.chain.length - 1];
  }

  public addBlock(block: Block) {
    console.log('Blockchain service: Adding block to the blockchain...');
    this.blockchain.chain.push(block);
    console.log('Blockchain service: Block added to the blockchain.');
  }

  @RabbitSubscribe({
    queue: 'miner-pool-announced-blocks-queue',
  })
  public async poolAnnouncedBlocksHandler(msg: object): Promise<void> {
    console.log(
      `Blockchain service: Received new block ${JSON.stringify(msg)}`,
    );

    // Map msg to Block model
    let block: Block = null;
    try {
      block = BlockDtoMapper.toBlock(msg as BlockDto);
    } catch (error) {
      console.error(
        'Blockchain service: Error mapping message to block, block discarded.',
      );
      return;
    }

    // Validate block
    if (this.validateBlock(block)) {
      this.addBlock(block);
    } else {
      console.error(
        `Blockchain service: Block #${block.id} is not valid, block discarded.`,
      );
    }
  }

  private validateBlock(block: Block): boolean {
    if (!block) {
      return false;
    }

    if (block.hash !== block.calculateHash()) {
      console.error(
        `Blockchain service: Block #${block.id} hash is incorrect, block discarded.`,
      );
      return false;
    }

    // Check if the block previous hash is correct
    const previousBlock = this.getLastBlock();
    if (block.previousHash !== previousBlock.hash) {
      console.error(
        `Blockchain service: Block #${block.id} previous hash is incorrect, block discarded.`,
      );
      return false;
    }

    return true;
  }

  public getBlockchainDto() {
    return null;
  }
}
