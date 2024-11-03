import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block } from './block';
import { Transaction } from 'src/transactions/transaction';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';
import { WalletsService } from 'src/wallets/wallets.service';
import { Wallet } from 'src/wallets/wallet';

@Injectable()
export class BlocksService {
  constructor(
    @Inject() private configService: ConfigService,
    @Inject() private walletsService: WalletsService,
  ) {
    console.log('Blocks service: Creating genesis block...');
    this.createGenesisBlock();
    console.log(
      'Blocks service: Done. The genesis block was created and added to the blockchain!',
    );
  }

  public createGenesisBlock() {
    const hash = this.configService.get<string>('blockchain.genesisBlock.hash');
    const nonce = this.configService.get<number>(
      'blockchain.genesisBlock.nonce',
    );
    const amount = this.configService.get<number>(
      'blockchain.genesisBlock.amount',
    );

    const coinbaseWallet = this.walletsService.getCoinbaseWallet();
    const recipientWallet = this.walletsService.getRandomWallet();

    const transaction = this.createGenesisTransaction(
      coinbaseWallet,
      recipientWallet.getPublicKey(),
      amount,
    );
    const genesisBlock: Block = new Block(
      [transaction],
      hash,
      '0',
      nonce,
      new Date(),
    );

    return genesisBlock;
  }

  private createGenesisTransaction(
    coinbaseWallet: Wallet,
    recipientWalletPublicKey: string,
    amount: number,
  ): Transaction {
    const transaction = new Transaction();
    transaction.senderPublicKey = coinbaseWallet.getPublicKey();
    transaction.recipientPublicKey = recipientWalletPublicKey;
    transaction.amount = amount;
    transaction.inputs = [];
    transaction.outputs = [
      {
        recipientPublicKey: recipientWalletPublicKey,
        amount: amount,
        parentTransactionId: '0',
        id: '0',
      },
    ];
    transaction.transactionFees = 0;
    transaction.transactionId = '0';
    transaction.signature = this.generateSignature(
      transaction.toString(),
      coinbaseWallet.getPrivateKey(),
    );

    return transaction;
  }

  private generateSignature(data: string, privateKey: string): string {
    const hash = createHash('sha256').update(data).digest();
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const signature = keyPair.sign(hash);
    return Buffer.from(signature).toString('hex');
  }
}
