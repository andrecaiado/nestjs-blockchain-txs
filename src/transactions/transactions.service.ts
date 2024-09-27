import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from './transaction';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';
import {
  TransactionDto,
  TransactionInputDto,
  TransactionOutputDto,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  public submitTransaction(transactionDto: TransactionDto): string {
    this.validateTransaction(
      this.mapTransactionDtoToTransaction(transactionDto),
    );
    return 'Transaction submitted';
  }

  private validateTransaction(transaction: Transaction): boolean {
    // Verify signature
    if (
      !this.verifySignature(
        transaction.toString(),
        transaction.signature,
        transaction.senderPublicKey,
      )
    ) {
      throw new BadRequestException('Invalid signature');
    }

    return true;
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

  private mapTransactionDtoToTransaction(
    transactionDto: TransactionDto,
  ): Transaction {
    const transaction = new Transaction();
    transaction.transactionId = transactionDto.transactionId;
    transaction.senderPublicKey = transactionDto.senderPublicKey;
    transaction.recipientPublicKey = transactionDto.recipientPublicKey;
    transaction.amount = transactionDto.amount;
    transaction.signature = transactionDto.signature;
    transaction.inputs = transactionDto.inputs.map((input) =>
      this.mapTransactionInputDtoToTransactionInput(input),
    );
    transaction.outputs = transactionDto.outputs.map((output) =>
      this.mapTransactionOutputDtoToTransactionOutput(output),
    );
    transaction.transactionFees = transactionDto.transactionFees;
    return transaction;
  }

  private mapTransactionInputDtoToTransactionInput(
    transactionInputDto: TransactionInputDto,
  ): TransactionInput {
    const transactionInput = new TransactionInput();
    transactionInput.transactionOutputId =
      transactionInputDto.transactionOutputId;
    transactionInput.UTXO = this.mapTransactionOutputDtoToTransactionOutput(
      transactionInputDto.UTXO,
    );
    return transactionInput;
  }

  private mapTransactionOutputDtoToTransactionOutput(
    transactionOutputDto: TransactionOutputDto,
  ): TransactionOutput {
    const transactionOutput = new TransactionOutput();
    transactionOutput.recipientPublicKey =
      transactionOutputDto.recipientPublicKey;
    transactionOutput.amount = transactionOutputDto.amount;
    transactionOutput.parentTransactionId =
      transactionOutputDto.parentTransactionId;
    transactionOutput.id = transactionOutputDto.id;
    return transactionOutput;
  }
}
