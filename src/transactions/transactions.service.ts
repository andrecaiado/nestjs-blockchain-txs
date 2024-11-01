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
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';
import { TransactionDto } from './dto/transaction.dto';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WalletsService } from 'src/wallets/wallets.service';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from 'src/pools/pools.service';
import { TransactionDtoMapper } from './dto/mappers/transaction.mapper';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
    @Inject() private readonly configService: ConfigService,
    @Inject() private readonly walletsService: WalletsService,
    @Inject() private readonly poolsService: PoolsService,
  ) {}

  public async submitTransaction(transactionDto: TransactionDto): Promise<any> {
    console.log(`Transaction ${transactionDto.transactionId}: submiting...`);

    this.validateTransaction(
      TransactionDtoMapper.toTransaction(transactionDto),
    );

    const result = await this.poolsService.publish(
      'global-tx-pool-exchange',
      null,
      transactionDto,
    );

    if (!result) {
      const errorMsg = `Transaction ${transactionDto.transactionId}: failed to submit`;
      console.error(errorMsg);
      throw new BadRequestException(errorMsg);
    }

    const successMsg = `Transaction ${transactionDto.transactionId}: submitted successfully.`;
    console.log(successMsg);

    return {
      message: successMsg,
    };
  }

  private validateTransaction(transaction: Transaction) {
    let errorMsg: string;

    // Verify signature
    if (
      !this.verifySignature(
        transaction.toString(),
        transaction.signature,
        transaction.senderPublicKey,
      )
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

  private verifyUTXOsAreUnspent(
    txUTXOs: TransactionOutput[],
    walletUTXOs: TransactionOutput[],
  ): boolean {
    return txUTXOs.every((txUTXO) =>
      walletUTXOs.some((walletUTXO) => walletUTXO.id === txUTXO.id),
    );
  }

  private getWalletUTXOs(publicKey: string): TransactionOutput[] {
    // console.log(`Transaction validation ${publicKey}: fetching UTXOs...`);
    return this.blockchainService.getWalletUTXOs(publicKey);
  }
}
