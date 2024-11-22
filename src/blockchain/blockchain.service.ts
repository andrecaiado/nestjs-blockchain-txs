import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Blockchain } from './blockchain';
import { TransactionOutput } from 'src/transactions/transaction';
import { Block } from 'src/blocks/block';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { BlockDto } from 'src/blocks/dto/block.dto';
import { BlockDtoMapper } from 'src/blocks/dto/mappers/block.dto.mapper';
import { BlockchainMapper } from './blockchain.mapper';
import { BlockMapper } from 'src/blocks/block.mapper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainService {
  private blockchain: Blockchain;

  constructor(@Inject() private readonly configService: ConfigService) {
    console.log('Blockchain service: Creating blockchain...');
    this.blockchain = new Blockchain();
    console.log('Blockchain service: Blockchain created!');
  }

  public getWalletUTXOs(walletPublicKey: string): TransactionOutput[] {
    const utxos: TransactionOutput[] = [];
    const spentOutputs = new Set();

    this.blockchain.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        transaction.inputs.forEach((input) => {
          if (input.UTXO.recipientPublicKey === walletPublicKey) {
            spentOutputs.add(`${input.transactionOutputId}`);
          }
        });
      });
    });

    this.blockchain.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        transaction.outputs.forEach((output) => {
          if (output.recipientPublicKey === walletPublicKey) {
            const utxoRef = `${output.id}`;
            if (!spentOutputs.has(utxoRef)) {
              utxos.push(output);
            }
          }
        });
      });
    });

    return utxos;
  }

  public getUTXOs() {
    const utxos: TransactionOutput[] = [];
    const spentOutputs = new Set();

    this.blockchain.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        transaction.inputs.forEach((input) => {
          spentOutputs.add(`${input.transactionOutputId}`);
        });
      });
    });

    this.blockchain.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        transaction.outputs.forEach((output) => {
          const utxoRef = `${output.id}`;
          if (!spentOutputs.has(utxoRef)) {
            utxos.push(output);
          }
        });
      });
    });

    return utxos;
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

    if (!this.blockchain.isChainValid()) {
      console.error(
        'Blockchain service: Blockchain is invalid, block discarded.',
      );
      return;
    }

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
    if (block.isValid(this.getLastBlock())) {
      this.addBlock(block);
    } else {
      console.error(
        `Blockchain service: Block #${block.id} is not valid, block discarded.`,
      );
    }
  }

  public getBlockchainDto() {
    const maxCoinSupply = this.configService.get<number>(
      'blockchain.maxCoinSupply',
    );
    return BlockchainMapper.toBlockchainDto(
      this.blockchain,
      this.getTotalUTXOs(),
      maxCoinSupply,
    );
  }

  public getTotalUTXOs() {
    return this.getUTXOs()
      .map((utxo) => utxo.amount)
      .reduce((a, b) => a + b, 0);
  }

  private findBlockById(blockId: number): Block {
    return this.blockchain.chain.find((block) => block.id === blockId);
  }

  public getBlock(blockId: string): BlockDto {
    const block = this.findBlockById(+blockId);
    if (block == null) {
      throw new NotFoundException(`Block with blockId '${blockId}' not found!`);
    }

    return BlockMapper.toBlockDto(block);
  }
}
