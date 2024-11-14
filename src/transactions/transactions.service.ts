import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from './transaction';
// import ECPairFactory from 'ecpair';
// import * as ecc from 'tiny-secp256k1';
// import { createHash } from 'node:crypto';
import { TransactionDto } from './dto/transaction.dto';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WalletsService } from 'src/wallets/wallets.service';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from 'src/pools/pools.service';
import { TransactionDtoMapper } from './dto/mappers/transaction.mapper';
import { Wallet } from 'src/wallets/wallet';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
    @Inject() private readonly configService: ConfigService,
    @Inject() private readonly walletsService: WalletsService,
    @Inject() private readonly poolsService: PoolsService,
  ) {}

  public async submitTransaction(transactionDto: TransactionDto): Promise<any> {
    console.log(
      `Transactions service: Transaction ${transactionDto.transactionId}: submitting...`,
    );

    this.validateTransaction(
      TransactionDtoMapper.toTransaction(transactionDto),
    );

    this.poolsService.publish(
      this.configService.get<string>('rabbitmq.exchanges[0].name'),
      transactionDto,
    );

    const msg = `Transaction ${transactionDto.transactionId}: submitted.`;
    console.log(msg);

    return {
      message: msg,
    };
  }

  private validateTransaction(transaction: Transaction) {
    let errorMsg: string;

    // Verify signature
    if (
      transaction.verifySignature(transaction.senderPublicKey) === false
      // !this.verifySignature(
      //   transaction.toString(),
      //   transaction.signature,
      //   transaction.senderPublicKey,
      // )
    ) {
      errorMsg = `Transaction ${transaction.transactionId} validation: signature is invalid`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transaction ${transaction.transactionId} validation: signature is valid`,
    );

    // Validate the wallets
    const senderWallet = this.walletsService.findWalletByPublicKey(
      transaction.senderPublicKey,
    );
    if (senderWallet === null || senderWallet === undefined) {
      errorMsg = `Transaction ${transaction.transactionId} validation: sender wallet not found`;
      console.error(errorMsg);
      throw new NotFoundException(errorMsg);
    }
    const recipientWallet = this.walletsService.findWalletByPublicKey(
      transaction.recipientPublicKey,
    );
    if (recipientWallet === null || recipientWallet === undefined) {
      errorMsg = `Transaction ${transaction.transactionId} validation: recipient wallet not found`;
      console.error(errorMsg);
      throw new NotFoundException(errorMsg);
    }

    // Get the transaction inputs for subsequent validations
    const txUTXOs = transaction.inputs.map((input) => input.UTXO);

    // Verify if the inputs UTXOs belong to the sender
    if (
      !this.verifyTransactionInputsOwnership(
        txUTXOs,
        transaction.senderPublicKey,
      )
    ) {
      errorMsg = `Transaction ${transaction.transactionId} validation: there are UTXOs in the inputs that do not belong to the sender`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transaction ${transaction.transactionId} validation: inputs UTXOs belong to the sender`,
    );

    // Get UTXOs from the sender's wallet for subsequent validations
    const walletUTXOs = this.getWalletUTXOs(transaction.senderPublicKey);

    // Verify if UTXOs are unspent
    if (!this.verifyUTXOsAreUnspent(txUTXOs, walletUTXOs)) {
      errorMsg = `Transaction ${transaction.transactionId}: there are UTXOs that are not unspent`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transaction ${transaction.transactionId} validation: UTXOs are unspent`,
    );

    // Get the transaction fees
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );

    // Verify if the inputs are enough to cover the outputs
    if (
      !this.validateTransactionOutputsCoverage(transaction, transactionFees)
    ) {
      errorMsg = `Transaction ${transaction.transactionId}: inputs are not enough to cover the outputs`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transaction ${transaction.transactionId} validation: inputs are enough to cover the outputs`,
    );

    return;
  }

  private calculateInputsAmount(inputs: TransactionInput[]): number {
    return inputs.reduce((acc, input) => acc + input.UTXO.amount, 0);
  }

  private calculateOutputsAmount(outputs: TransactionOutput[]): number {
    return outputs.reduce((acc, output) => acc + output.amount, 0);
  }

  private validateTransactionOutputsCoverage(
    transaction: Transaction,
    transactionFees: number,
  ): boolean {
    const transactionInputsAmount = this.calculateInputsAmount(
      transaction.inputs,
    );
    const transactionOutputsAmount = this.calculateOutputsAmount(
      transaction.outputs,
    );
    const expectedAmount = transactionOutputsAmount + transactionFees;
    return transactionInputsAmount >= expectedAmount;
  }

  private verifyTransactionInputsOwnership(
    UTXOs: TransactionOutput[],
    publicKey: string,
  ): boolean {
    return UTXOs.every((UTXO) => UTXO.recipientPublicKey === publicKey);
  }

  // private verifySignature(
  //   data: string,
  //   signature: string,
  //   publicKey: string,
  // ): boolean {
  //   const hash = createHash('sha256').update(data).digest();
  //   const ECPair = ECPairFactory(ecc);
  //   const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
  //   return keyPair.verify(hash, Buffer.from(signature, 'hex'));
  // }

  public verifyUTXOsAreUnspent(
    txUTXOs: TransactionOutput[],
    walletUTXOs: TransactionOutput[],
  ): boolean {
    return txUTXOs.every((txUTXO) =>
      walletUTXOs.some((walletUTXO) => walletUTXO.id === txUTXO.id),
    );
  }

  private getWalletUTXOs(publicKey: string): TransactionOutput[] {
    return this.blockchainService.getWalletUTXOs(publicKey);
  }

  public createGenesisTransaction(): Transaction {
    const amount = this.configService.get<number>(
      'blockchain.genesisTransaction.amount',
    );
    const coinbaseWallet = this.walletsService.getCoinbaseWallet();
    const recipientWallet = this.walletsService.getRandomWallet();

    const transaction = new Transaction();
    transaction.senderPublicKey = coinbaseWallet.publicKey;
    transaction.recipientPublicKey = recipientWallet.publicKey;
    transaction.amount = amount;
    transaction.inputs = [];

    const txo = new TransactionOutput();
    txo.recipientPublicKey = recipientWallet.publicKey;
    txo.amount = amount;
    txo.parentTransactionId = '0';
    txo.id = '0';
    transaction.outputs = [txo];
    // [
    //   {
    //     recipientPublicKey: recipientWallet.publicKey,
    //     amount: amount,
    //     parentTransactionId: '0',
    //     id: '0',
    //   },
    // ];
    transaction.transactionFees = 0;
    transaction.transactionId = '0';
    transaction.signature = transaction.sign(coinbaseWallet.privateKey);
    // transaction.signature = this.generateSignature(
    //   transaction.toString(),
    //   coinbaseWallet.privateKey,
    // );

    return transaction;
  }

  // private generateSignature(data: string, privateKey: string): string {
  //   const hash = createHash('sha256').update(data).digest();
  //   const ECPair = ECPairFactory(ecc);
  //   const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
  //   const signature = keyPair.sign(hash);
  //   return Buffer.from(signature).toString('hex');
  // }

  public createCoinbaseTransaction(
    minerWallet: Wallet,
    transactionFees: number,
  ): Transaction {
    const minerReward: number =
      this.configService.get<number>('blockchain.minerReward') +
      transactionFees;

    const txo = new TransactionOutput();
    txo.recipientPublicKey = minerWallet.publicKey;
    txo.amount = minerReward;
    txo.parentTransactionId = '0';
    txo.id = txo.generateTransactionOutputId();
    //txo.id = this.createTransactionId('', minerWallet.publicKey, minerReward);

    const transaction = new Transaction();
    transaction.transactionId = '0';
    transaction.senderPublicKey = '';
    transaction.recipientPublicKey = minerWallet.publicKey;
    transaction.amount = minerReward;
    transaction.inputs = [];
    transaction.outputs = [txo];
    transaction.transactionFees = 0;
    transaction.signature = '';

    return transaction;
  }

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
}
