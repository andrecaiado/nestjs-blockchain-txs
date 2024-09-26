import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from 'src/transactions/transaction';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';
import { WalletDto } from './dto/wallet.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject() private readonly configService: ConfigService,
  ) {
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

  public getWallet(publicKey: string): WalletDto {
    const wallet = this.findWalletByPublicKey(publicKey);
    if (wallet === null || wallet === undefined) {
      throw new NotFoundException(
        `Wallet with public address '${publicKey}' not found!`,
      );
    }
    return this.mapWalletToWalletDto(wallet);
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
    const { senderWallet, recipientWallet, senderWalletBalance, UTXOs } =
      this.validateCreateTransactionRequest(
        senderPublicKey,
        createTransactionDto.recipientPublicKey,
        createTransactionDto.amount,
      );
    const recipientPublicKey = recipientWallet.getPublicKey();
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );
    const transactionChange =
      senderWalletBalance - (createTransactionDto.amount + transactionFees);

    const transaction = new Transaction();
    transaction.transactionId = this.createTransactionId(
      senderPublicKey,
      recipientPublicKey,
      createTransactionDto.amount,
    );
    transaction.senderPublicKey = senderPublicKey;
    transaction.recipientPublicKey = recipientPublicKey;
    transaction.inputs = this.createTransactionInputs(UTXOs);
    transaction.outputs = this.createTransactionOutputs(
      recipientPublicKey,
      createTransactionDto.amount,
      transaction.transactionId,
      transactionChange,
    );
    transaction.amount = createTransactionDto.amount;
    transaction.transactionFees = transactionFees;

    transaction.signature = this.generateSignature(
      transaction,
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

  private generateSignature(
    transaction: Transaction,
    privateKey: string,
  ): string {
    const data = transaction.toString();

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
    recipientPublicKey: string,
    amount: number,
  ): {
    senderWallet: Wallet;
    recipientWallet: Wallet;
    senderWalletBalance: number;
    UTXOs: TransactionOutput[];
  } {
    // Verify that the sender wallet exists
    const senderWallet = this.findWalletByPublicKey(senderPublicKey);
    if (senderWallet === null || senderWallet === undefined) {
      throw new NotFoundException(
        `Sender Wallet with public key '${senderPublicKey}' not found!`,
      );
    }

    // Verify that the recipient wallet exists
    const recipientWallet = this.findWalletByPublicKey(recipientPublicKey);
    if (recipientWallet === null || recipientWallet === undefined) {
      throw new NotFoundException(
        `Recipient Wallet with public key '${recipientPublicKey}' not found!`,
      );
    }

    // Verify that the sender and recipient are not the same
    if (senderPublicKey === recipientPublicKey) {
      throw new BadRequestException(
        `Sender and Recipient wallets cannot be the same!`,
      );
    }

    // Verify that the amount is positive
    if (amount <= 0) {
      throw new BadRequestException(`Amount must be positive!`);
    }

    // Validate that the sender has enough balance to cover the transaction (amount + transaction fees)
    // We will need to get the sender UTXOs to calculate the balance
    // This can be an expensive operation so we are going to use them inside this function but also return them
    const UTXOs = this.getWalletUTXOs(senderPublicKey);
    // Calculate the balance from the UTXOs
    const senderWalletBalance = this.calculateBalanceFromUTXOS(UTXOs);
    // Validate the balance
    // const senderWalletBalance = this.validateBalanceForTransaction(
    //   balance,
    //   amount,
    //   senderPublicKey,
    // );
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );
    if (senderWalletBalance < amount + transactionFees) {
      throw new BadRequestException(
        `Insufficient balance for wallet '${senderPublicKey}'!\n Balance is: ${senderWalletBalance}. Required: ${amount + transactionFees} (amount + transaction fees)`,
      );
    }

    return { senderWallet, recipientWallet, senderWalletBalance, UTXOs };
  }

  private createTransactionInputs(
    UTXOs: TransactionOutput[],
  ): TransactionInput[] {
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
    transactionChange: number,
  ): TransactionOutput[] {
    // Create transaction output for recipient
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
    // Add change output (if any) to sender
    if (transactionChange > 0) {
      const changeOutput = new TransactionOutput();
      changeOutput.amount = transactionChange;
      changeOutput.id = this.createTransactionOutputId(
        recipientPublicKey,
        transactionChange,
        parentTransactionId,
      );
      changeOutput.parentTransactionId = parentTransactionId;
      changeOutput.recipientPublicKey = recipientPublicKey;
      outputs.push(changeOutput);
    }
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

  private calculateBalanceFromUTXOS(UTXOs: TransactionOutput[]): number {
    return UTXOs.reduce((acc, UTXO) => acc + UTXO.amount, 0);
  }

  private getWalletUTXOs(publicKey: string): TransactionOutput[] {
    return this.blockchainService.getWalletUTXOs(publicKey);
  }

  private mapWalletToWalletDto(wallet: Wallet): WalletDto {
    const walletDto = new WalletDto();
    walletDto.name = wallet.getName();
    walletDto.publicKey = wallet.getPublicKey();
    walletDto.balance = this.getWalletBalance(wallet.getPublicKey());

    return walletDto;
  }

  private getWalletBalance(publicKey: string): number {
    const UTXOs = this.getWalletUTXOs(publicKey);
    return this.calculateBalanceFromUTXOS(UTXOs);
  }
}
