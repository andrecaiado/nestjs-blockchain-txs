import { Injectable } from '@nestjs/common';
import { Blockchain } from './blockchain';
import { TransactionOutput } from 'src/transactions/transaction';

@Injectable()
export class BlockchainService {
  private blockchain: Blockchain;

  constructor() {
    console.log('Creating blockchain...');
    this.blockchain = new Blockchain();
    console.log('Blockchain created!');
  }

  public getWalletUTXOs(walletPublicKey: string): TransactionOutput[] {
    console.log(`Getting UTXOs for wallet ${walletPublicKey}...`);
    // This is mocked data.
    const txo = new TransactionOutput();
    txo.amount = 100.54;
    txo.id = '123';
    txo.parentTransactionId = '123';
    txo.recipientPublicKey = walletPublicKey;
    return [txo];
  }
}
