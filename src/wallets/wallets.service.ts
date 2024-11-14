import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransactionOutput } from 'src/transactions/transaction';
import { BlockchainService } from 'src/blockchain/blockchain.service';
// import ECPairFactory from 'ecpair';
// import * as ecc from 'tiny-secp256k1';
// import { createHash } from 'node:crypto';
import { WalletDto } from './dto/wallet.dto';
import { ConfigService } from '@nestjs/config';
import { WalletMapper } from './mappers/wallet.mapper';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];
  private coinbaseWallet: Wallet;

  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
    @Inject() private readonly configService: ConfigService,
  ) {
    this.createCoinbaseWallet();
    this.createDefaultWallets();
  }

  private createDefaultWallets(): void {
    console.log('Wallet service: Creating first wallets...');
    this.createWallet({ name: 'Wallet-1' });
    this.createWallet({ name: 'Wallet-2' });
    console.log(
      `Wallet service: Done. Created ${this.wallets.length} wallets!`,
    );
  }

  private createCoinbaseWallet() {
    console.log('Wallet service: Creating Coinbase wallet...');
    this.coinbaseWallet = new Wallet('CoinbaseWallet');
    console.log('Wallet service: Done. The Coinbase wallet was created!');
  }

  public getCoinbaseWallet() {
    return this.coinbaseWallet;
  }

  public createWallet(createWalletDto: CreateWalletDto): WalletDto {
    this.validateWalletCreation(createWalletDto);
    const wallet = new Wallet(createWalletDto.name);
    this.wallets.push(wallet);

    const walletDto = WalletMapper.toWalletDto(wallet);
    walletDto.balance = this.getWalletBalance(wallet.publicKey);

    return walletDto;
  }

  public getWallets(): WalletDto[] {
    return this.wallets.map((wallet) => {
      const walletDto = WalletMapper.toWalletDto(wallet);
      walletDto.balance = this.getWalletBalance(wallet.publicKey);

      return walletDto;
    });
  }

  public getRandomWallet(): Wallet {
    return this.wallets[Math.floor(Math.random() * Array.length)];
  }

  public getWallet(publicKey: string): WalletDto {
    const wallet = this.findWalletByPublicKey(publicKey);
    if (wallet === null || wallet === undefined) {
      throw new NotFoundException(
        `Wallet with public address '${publicKey}' not found!`,
      );
    }
    const walletDto = WalletMapper.toWalletDto(wallet);
    walletDto.balance = this.getWalletBalance(wallet.publicKey);

    return walletDto;
  }

  public findWalletByPublicKey(publicKey: string): Wallet {
    return this.wallets.find((wallet) => wallet.publicKey === publicKey);
  }

  private validateWalletCreation(createWalletDto: CreateWalletDto) {
    this.validateWalletName(createWalletDto.name);
  }

  private validateWalletName(name: string) {
    const wallet = this.wallets.find((wallet) => wallet.name === name);
    if (wallet !== null && wallet !== undefined) {
      throw new ConflictException(`Wallet with name '${name}' already exists!`);
    }
  }

  // public createTransaction(
  //   senderPublicKey: string,
  //   createTransactionDto: CreateTransactionDto,
  // ): TransactionDto {
  //   console.log(`Wallet ${senderPublicKey}: creating a transaction...`);

  //   const UTXOs = this.getWalletUTXOs(senderPublicKey);
  //   const transactionFees = this.configService.get<number>(
  //     'blockchain.transactionFees',
  //   );

  //   const { senderWallet, senderWalletBalance } =
  //     this.validateCreateTransactionRequest(
  //       senderPublicKey,
  //       createTransactionDto.recipientPublicKey,
  //       createTransactionDto.amount,
  //       UTXOs,
  //       transactionFees,
  //     );

  //   const recipientPublicKey = createTransactionDto.recipientPublicKey;
  //   let transactionChange =
  //     senderWalletBalance - (createTransactionDto.amount + transactionFees);
  //   transactionChange = Number(transactionChange.toFixed(3));

  //   const transaction = new Transaction();
  //   // transaction.transactionId = this.createTransactionId(
  //   //   senderPublicKey,
  //   //   recipientPublicKey,
  //   //   createTransactionDto.amount,
  //   // );
  //   transaction.senderPublicKey = senderPublicKey;
  //   transaction.recipientPublicKey = recipientPublicKey;
  //   transaction.amount = createTransactionDto.amount;
  //   transaction.transactionFees = transactionFees;
  //   transaction.transactionId = transaction.generateTransactionId();
  //   transaction.inputs = this.createTransactionInputs(UTXOs);
  //   transaction.outputs = this.createTransactionOutputs(
  //     recipientPublicKey,
  //     createTransactionDto.amount,
  //     transaction.transactionId,
  //     transactionChange,
  //     senderPublicKey,
  //   );
  //   transaction.signature = transaction.sign(senderWallet.privateKey);
  //   // transaction.signature = this.generateSignature(
  //   //   transaction.toString(),
  //   //   senderWallet.privateKey,
  //   // );

  //   console.log(
  //     `Wallet service: Wallet ${senderPublicKey}: transaction ID is '${transaction.transactionId}'`,
  //   );

  //   return WalletMapper.toTransactionDto(transaction);
  // }

  // private createTransactionId(
  //   publicKey: string,
  //   recipientAddress: string,
  //   amount: number,
  // ): string {
  //   return createHash('sha256')
  //     .update(publicKey)
  //     .update(recipientAddress)
  //     .update(amount.toString())
  //     .update(new Date().getTime().toString())
  //     .digest('hex');
  // }

  // private generateSignature(data: string, privateKey: string): string {
  //   const hash = createHash('sha256').update(data).digest();
  //   const ECPair = ECPairFactory(ecc);
  //   const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  //   const signature = keyPair.sign(hash);
  //   return Buffer.from(signature).toString('hex');
  // }

  // private validateCreateTransactionRequest(
  //   senderPublicKey: string,
  //   recipientPublicKey: string,
  //   amount: number,
  //   UTXOs: TransactionOutput[],
  //   transactionFees: number,
  // ): {
  //   senderWallet: Wallet;
  //   senderWalletBalance: number;
  // } {
  //   console.log(`Wallet ${senderPublicKey}: transaction is being validated...`);

  //   let errorMsg: string;

  //   // Verify that the sender wallet exists
  //   const senderWallet = this.findWalletByPublicKey(senderPublicKey);
  //   if (senderWallet === null || senderWallet === undefined) {
  //     errorMsg = `Sender Wallet with public key '${senderPublicKey}' not found!`;
  //     console.error(errorMsg);
  //     throw new NotFoundException(errorMsg);
  //   }

  //   // Verify that the recipient wallet exists
  //   const recipientWallet = this.findWalletByPublicKey(recipientPublicKey);
  //   if (recipientWallet === null || recipientWallet === undefined) {
  //     errorMsg = `Recipient Wallet with public key '${recipientPublicKey}' not found!`;
  //     console.error(errorMsg);
  //     throw new NotFoundException(errorMsg);
  //   }

  //   // Verify that the sender and recipient are not the same
  //   if (senderPublicKey === recipientPublicKey) {
  //     errorMsg = `Sender and Recipient wallets cannot be the same!`;
  //     console.error(errorMsg);
  //     throw new BadRequestException(errorMsg);
  //   }

  //   // Validate that the sender has enough balance to cover the transaction (amount + transaction fees)
  //   // Calculate the balance from the UTXOs
  //   const senderWalletBalance = this.calculateBalanceFromUTXOS(UTXOs);
  //   if (senderWalletBalance < amount + transactionFees) {
  //     errorMsg = `Insufficient balance for wallet '${senderPublicKey}'!\n Balance is: ${senderWalletBalance}. Required: ${amount + transactionFees} (amount + transaction fees)`;
  //     console.error(errorMsg);
  //     throw new BadRequestException(errorMsg);
  //   }

  //   console.log(`Wallet ${senderPublicKey}: transaction is valid.`);

  //   return { senderWallet, senderWalletBalance };
  // }

  // private createTransactionInputs(
  //   UTXOs: TransactionOutput[],
  // ): TransactionInput[] {
  //   return UTXOs.map((UTXO) => {
  //     const transaction = new TransactionInput();
  //     transaction.transactionOutputId = UTXO.id;
  //     transaction.UTXO = UTXO;
  //     return transaction;
  //   });
  // }

  // private createTransactionOutputs(
  //   recipientPublicKey: string,
  //   amount: number,
  //   parentTransactionId: string,
  //   transactionChange: number,
  //   senderPublicKey: string,
  // ): TransactionOutput[] {
  //   // Create transaction output for recipient
  //   const outputs: TransactionOutput[] = [];
  //   const output = new TransactionOutput();
  //   output.amount = amount;
  //   // output.id = this.createTransactionOutputId(
  //   //   recipientPublicKey,
  //   //   amount,
  //   //   parentTransactionId,
  //   // );
  //   output.parentTransactionId = parentTransactionId;
  //   output.recipientPublicKey = recipientPublicKey;
  //   output.id = output.generateTransactionOutputId();
  //   outputs.push(output);

  //   // Add change output (if any) to sender
  //   if (transactionChange > 0) {
  //     const changeOutput = new TransactionOutput();
  //     changeOutput.amount = transactionChange;
  //     // changeOutput.id = this.createTransactionOutputId(
  //     //   recipientPublicKey,
  //     //   transactionChange,
  //     //   parentTransactionId,
  //     // );
  //     changeOutput.parentTransactionId = parentTransactionId;
  //     changeOutput.recipientPublicKey = senderPublicKey;
  //     output.id = output.generateTransactionOutputId();
  //     outputs.push(changeOutput);
  //   }
  //   return outputs;
  // }

  // private createTransactionOutputId(
  //   recipientPublicKey: string,
  //   amount: number,
  //   parentTransactionId: string,
  // ): string {
  //   return createHash('sha256')
  //     .update(recipientPublicKey)
  //     .update(parentTransactionId)
  //     .update(amount.toString())
  //     .digest('hex');
  // }

  private calculateBalanceFromUTXOS(UTXOs: TransactionOutput[]): number {
    return UTXOs.reduce((acc, UTXO) => acc + UTXO.amount, 0);
  }

  // private getWalletUTXOs(publicKey: string): TransactionOutput[] {
  //   console.log(`Wallet service: Wallet ${publicKey}: fetching UTXOs...`);
  //   return this.blockchainService.getWalletUTXOs(publicKey);
  // }

  private getWalletBalance(publicKey: string): number {
    const UTXOs = this.blockchainService.getWalletUTXOs(publicKey);
    return this.calculateBalanceFromUTXOS(UTXOs);
  }
}
