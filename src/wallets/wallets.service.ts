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
import { TransactionDto, TransactionInputDto, TransactionOutputDto } from 'src/transactions/dto/transaction.dto';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];

  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
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

  public createWallet(createWalletDto: CreateWalletDto): WalletDto {
    this.validateWalletCreation(createWalletDto);
    const wallet = new Wallet(createWalletDto.name);
    this.wallets.push(wallet);
    return this.mapWalletToWalletDto(wallet);
  }

  public getWallets(): WalletDto[] {
    return this.wallets.map((wallet) => this.mapWalletToWalletDto(wallet));
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
  ): TransactionDto {
    console.log(`Wallet ${senderPublicKey}: creating a transaction...`);

    const UTXOs = this.getWalletUTXOs(senderPublicKey);
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );

    const { senderWallet, senderWalletBalance } =
      this.validateCreateTransactionRequest(
        senderPublicKey,
        createTransactionDto.recipientPublicKey,
        createTransactionDto.amount,
        UTXOs,
        transactionFees,
      );

    const recipientPublicKey = createTransactionDto.recipientPublicKey;
    let transactionChange =
      senderWalletBalance - (createTransactionDto.amount + transactionFees);
    transactionChange = Number(transactionChange.toFixed(3));

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
      transaction.toString(),
      senderWallet.getPrivateKey(),
    );

    console.log(
      `Wallet ${senderPublicKey}: transaction ID is '${transaction.transactionId}'`,
    );

    return this.mapTransactionToTransactionDto(transaction);
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

  private validateCreateTransactionRequest(
    senderPublicKey: string,
    recipientPublicKey: string,
    amount: number,
    UTXOs: TransactionOutput[],
    transactionFees: number,
  ): {
    senderWallet: Wallet;
    senderWalletBalance: number;
  } {
    console.log(`Wallet ${senderPublicKey}: transaction is being validated...`);

    let errorMsg: string;

    // Verify that the sender wallet exists
    const senderWallet = this.findWalletByPublicKey(senderPublicKey);
    if (senderWallet === null || senderWallet === undefined) {
      errorMsg = `Sender Wallet with public key '${senderPublicKey}' not found!`;
      console.error(errorMsg);
      throw new NotFoundException(errorMsg);
    }

    // Verify that the recipient wallet exists
    const recipientWallet = this.findWalletByPublicKey(recipientPublicKey);
    if (recipientWallet === null || recipientWallet === undefined) {
      errorMsg = `Recipient Wallet with public key '${recipientPublicKey}' not found!`;
      console.error(errorMsg);
      throw new NotFoundException(errorMsg);
    }

    // Verify that the sender and recipient are not the same
    if (senderPublicKey === recipientPublicKey) {
      errorMsg = `Sender and Recipient wallets cannot be the same!`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }

    // Validate that the sender has enough balance to cover the transaction (amount + transaction fees)
    // Calculate the balance from the UTXOs
    const senderWalletBalance = this.calculateBalanceFromUTXOS(UTXOs);
    if (senderWalletBalance < amount + transactionFees) {
      errorMsg = `Insufficient balance for wallet '${senderPublicKey}'!\n Balance is: ${senderWalletBalance}. Required: ${amount + transactionFees} (amount + transaction fees)`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }

    console.log(`Wallet ${senderPublicKey}: transaction is valid.`);

    return { senderWallet, senderWalletBalance };
  }

  private createTransactionInputs(
    UTXOs: TransactionOutput[],
  ): TransactionInput[] {
    return UTXOs.map((UTXO) => {
      const transaction = new TransactionInput();
      transaction.transactionOutputId = UTXO.id;
      transaction.UTXO = UTXO;
      return transaction;
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
    console.log(`Wallet ${publicKey}: fetching UTXOs...`);
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

  private mapTransactionToTransactionDto(transaction: Transaction) {
    const transactionDto = new TransactionDto();
    transactionDto.transactionId = transaction.transactionId;
    transactionDto.amount = transaction.amount;
    transactionDto.recipientPublicKey = transaction.recipientPublicKey;
    transactionDto.senderPublicKey = transaction.senderPublicKey;
    transactionDto.signature = transaction.signature;
    transactionDto.transactionFees = transaction.transactionFees;
    transactionDto.inputs = transaction.inputs.map((input) => {
      return this.mapTransactionInputToTransactionInputDto(input);
    });
    transactionDto.outputs = transaction.outputs.map((output) => {
      return this.mapTransactionOutputToTransactionOutputDto(output);
    });
    return transactionDto;
  }

  private mapTransactionOutputToTransactionOutputDto(
    transactionOutput: TransactionOutput,
  ) {
    const transactionOutputDto = new TransactionOutputDto();
    transactionOutputDto.amount = transactionOutput.amount;
    transactionOutputDto.id = transactionOutput.id;
    transactionOutputDto.parentTransactionId =
      transactionOutput.parentTransactionId;
    transactionOutputDto.recipientPublicKey =
      transactionOutput.recipientPublicKey;
    return transactionOutputDto;
  }

  private mapTransactionInputToTransactionInputDto(
    transactionInput: TransactionInput,
  ) {
    const transactionInputDto = new TransactionInputDto();
    transactionInputDto.transactionOutputId =
      transactionInput.transactionOutputId;
    transactionInputDto.UTXO = this.mapTransactionOutputToTransactionOutputDto(
      transactionInput.UTXO,
    );
    return transactionInputDto;
  }
}
