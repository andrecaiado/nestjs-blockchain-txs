import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from 'src/transactions/transaction';
import {
  TransactionDto,
  TransactionInputDto,
  TransactionOutputDto,
} from '../transaction.dto';

export class TransactionDtoMapper {
  static toTransaction(transactionDto: TransactionDto): Transaction {
    const transaction = new Transaction();
    transaction.transactionId = transactionDto.transactionId;
    transaction.senderPublicKey = transactionDto.senderPublicKey;
    transaction.recipientPublicKey = transactionDto.recipientPublicKey;
    transaction.amount = transactionDto.amount;
    transaction.signature = transactionDto.signature;
    transaction.inputs = transactionDto.inputs.map((input) =>
      this.toTransactionInput(input),
    );
    transaction.outputs = transactionDto.outputs.map((output) =>
      this.toTransactionOutput(output),
    );
    transaction.transactionFees = transactionDto.transactionFees;
    return transaction;
  }

  static toTransactionInput(
    transactionInputDto: TransactionInputDto,
  ): TransactionInput {
    const transactionInput = new TransactionInput();
    transactionInput.transactionOutputId =
      transactionInputDto.transactionOutputId;
    transactionInput.UTXO = this.toTransactionOutput(transactionInputDto.UTXO);
    return transactionInput;
  }

  static toTransactionOutput(
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
