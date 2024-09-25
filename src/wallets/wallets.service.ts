import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionInput, TransactionOutput } from 'src/transactions/transaction';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Removed unused and incorrect import
import { createHash } from 'node:crypto';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];

  constructor(private readonly blockchainService: BlockchainService) {
    this.createDefaultWallets();
  }

  private createDefaultWallets(): void {
    this.wallets = [];
    console.log('Creating default wallets...');
    this.createWallet({ name: 'Wallet-1' });
    this.createWallet({ name: 'Wallet-2' });
    console.log(`Done. Created ${this.wallets.length} wallets!`);
  }

  public createWallet(createWalletDto: CreateWalletDto): Wallet {
    this.validateWalletCreation(createWalletDto);
    const wallet = new Wallet(createWalletDto.name);
    this.wallets.push(wallet);
    return wallet;
  }

  public getWallets(): Wallet[] {
    return this.wallets;
  }

  public getWallet(publicKey: string): Wallet {
    const wallet = this.findWalletByPublicKey(publicKey);
    if (wallet === null || wallet === undefined) {
      throw new NotFoundException(
        `Wallet with public address '${publicKey}' not found!`,
      );
    }
    return wallet;
  }

  private findWalletByPublicKey(publicKey: string): Wallet {
    return this.wallets.find((wallet) => wallet.getPublicKey() === publicKey);
  }

  private validateWalletCreation(createWalletDto: CreateWalletDto) {
    this.validateWalletName(createWalletDto.name);
  }

  private validateWalletName(name: string) {
    const wallet = this.wallets.find((wallet) => wallet.getName() === name);
    if (wallet !== null && wallet !== undefined) {
      throw new ConflictException(`Wallet with name '${name}' already exists!`);
    }
  }

  public createTransaction(
    senderPublicKey: string,
    createTransactionDto: CreateTransactionDto,
  ): Transaction {
    this.validateCreateTransactionRequest(
      senderPublicKey,
      createTransactionDto,
    );

    const senderWallet = this.findWalletByPublicKey(senderPublicKey);

    const transaction = new Transaction();
    transaction.transactionId = this.createTransactionId(
      senderWallet.getPublicKey(),
      createTransactionDto.recipientPublicKey,
      createTransactionDto.amount,
    );
    transaction.senderPublicKey = senderWallet.getPublicKey();
    transaction.recipientPublicKey = createTransactionDto.recipientPublicKey;
    transaction.inputs = this.createTransactionInputs(senderPublicKey);
    transaction.outputs = this.createTransactionOutputs(
      createTransactionDto.recipientPublicKey,
      createTransactionDto.amount,
      transaction.transactionId,
    );
    transaction.amount = createTransactionDto.amount;

    const data =
      transaction.senderPublicKey +
      transaction.recipientPublicKey +
      transaction.amount.toString();

    transaction.signature = this.generateSignature(
      data,
      senderWallet.getPrivateKey(),
    );

    return transaction;
  }

  private createTransactionId(
    publicKey: string,
    recipientAddress: string,
    amount: number,
  ): string {
    return createHash('sha256')
      .update(publicKey)
      .update(recipientAddress)
      .update(amount.toString())
      .update(new Date().toISOString())
      .digest('hex');
  }

  private generateSignature(data: string, privateKey: string): string {
    const hash = createHash('sha256').update(data).digest();
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const signature = keyPair.sign(hash);
    return Buffer.from(signature).toString('hex');
  }

  private verifySignature(
    data: string,
    signature: string,
    publicKey: string,
  ): boolean {
    const hash = createHash('sha256').update(data).digest();
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
    return keyPair.verify(hash, Buffer.from(signature, 'hex'));
  }

  private validateCreateTransactionRequest(
    senderPublicKey: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    // Verify that the sender wallet exists
    const senderWallet = this.findWalletByPublicKey(senderPublicKey);
    if (senderWallet === null || senderWallet === undefined) {
      throw new NotFoundException(
        `Sender Wallet with public key '${senderPublicKey}' not found!`,
      );
    }
    // Verify that the recipient wallet exists
    const recipientWallet = this.findWalletByPublicKey(
      createTransactionDto.recipientPublicKey,
    );
    if (recipientWallet === null || recipientWallet === undefined) {
      throw new NotFoundException(
        `Recipient Wallet with public key '${createTransactionDto.recipientPublicKey}' not found!`,
      );
    }
  }

  private createTransactionInputs(publicKey: string): TransactionInput[] {
    const UTXOs = this.blockchainService.getWalletUTXOs(publicKey);
    return UTXOs.map((UTXO) => {
      const input = {
        transactionOutputId: UTXO.id,
        UTXO,
      };
      return input;
    });
  }

  private createTransactionOutputs(
    recipientPublicKey: string,
    amount: number,
    parentTransactionId: string,
  ): TransactionOutput[] {
    const outputs: TransactionOutput[] = [];
    const output = new TransactionOutput();
    output.amount = amount;
    output.id = this.createTransactionOutputId(
      recipientPublicKey,
      amount,
      parentTransactionId,
    );
    output.parentTransactionId = parentTransactionId;
    output.recipientPublicKey = recipientPublicKey;
    outputs.push(output);
    return outputs;
  }

  private createTransactionOutputId(
    recipientPublicKey: string,
    amount: number,
    parentTransactionId: string,
  ): string {
    return createHash('sha256')
      .update(recipientPublicKey)
      .update(parentTransactionId)
      .update(amount.toString())
      .digest('hex');
  }

  // public getWalletBalance(publicKey: string): number {
  //   const UTXOs = this.blockchainService.getWalletUTXOs(publicKey);
  //   return UTXOs.reduce((acc, UTXO) => acc + UTXO.amount, 0);
  // }
}
