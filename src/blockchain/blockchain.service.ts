import { Injectable } from '@nestjs/common';
import { Blockchain } from './blockchain';
import { TransactionOutput } from 'src/transactions/transaction';
import { Block } from 'src/blocks/block';

@Injectable()
export class BlockchainService {
  private blockchain: Blockchain;

  constructor() {
    console.log('Blockchain service: Creating blockchain...');
    this.blockchain = new Blockchain();
    console.log('Blockchain service: Blockchain created!');
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
    this.blockchain.getChain().push(genesisBlock);
    console.log('Blockchain service: Genesis block added to the blockchain.');
  }

  public getLastBlock() {
    return this.blockchain.getChain()[this.blockchain.getChain().length - 1];
  }

  public addBlock(block: Block) {
    console.log('Blockchain service: Adding block to the blockchain...');
    this.blockchain.getChain().push(block);
    console.log('Blockchain service: Block added to the blockchain.');
  }
}
