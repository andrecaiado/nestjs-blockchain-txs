import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block } from './block';
import { Transaction } from 'src/transactions/transaction';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';
import { WalletsService } from 'src/wallets/wallets.service';
import { Wallet } from 'src/wallets/wallet';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class BlocksService {
  constructor(
    @Inject() private configService: ConfigService,
    @Inject() private walletsService: WalletsService,
    @Inject() private blockchainService: BlockchainService,
    @Inject() private transactionsService: TransactionsService,
  ) {
    console.log('Blocks service: Creating genesis block...');
    const genesisBlock = this.createGenesisBlock();
    console.log('Blocks service: Done. The genesis block was created!');
    this.blockchainService.addGenesisBlock(genesisBlock);
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
      recipientWallet.publicKey,
      amount,
    );
    const genesisBlock: Block = {
      transactions: [transaction],
      hash: hash,
      previousHash: '0',
      nonce: nonce,
      timestamp: new Date(),
    };

    return genesisBlock;
  }

  private createGenesisTransaction(
    coinbaseWallet: Wallet,
    recipientWalletPublicKey: string,
    amount: number,
  ): Transaction {
    const transaction = new Transaction();
    transaction.senderPublicKey = coinbaseWallet.publicKey;
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
      coinbaseWallet.privateKey,
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

  public createBlock(transactions: Transaction[]): Block {
    console.log(
      `Blocks service: Creating new block with ${transactions.length + 1} transaction(s)...`,
    );
    const previousBlock = this.blockchainService.getLastBlock();
    const previousHash = previousBlock.hash;

    const coinbaseTransaction =
      this.transactionsService.createCoinbaseTransaction();
    transactions.unshift(coinbaseTransaction);

    const newBlock: Block = {
      transactions: transactions,
      hash: null,
      previousHash: previousHash,
      nonce: null,
      timestamp: null,
    };

    console.log('Blocks service: New block created.');

    return newBlock;
  }
}
