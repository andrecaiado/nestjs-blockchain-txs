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
      id: 0,
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
    newBlock.transactions = transactions;
    newBlock.hash = '';
    newBlock.previousHash = previousHash;
    newBlock.nonce = 0;
    newBlock.timestamp = new Date();
    // {
    //   transactions: transactions,
    //   hash: '',
    //   previousHash: previousHash,
    //   nonce: 0,
    //   timestamp: new Date(),
    // };

    console.log(
      `Blocks service: Created new block with ${transactions.length} transaction(s).`,
    );

    return newBlock;
  }
}
