import {
  TransactionDto,
  TransactionInputDto,
  TransactionOutputDto,
} from 'src/transactions/dto/transaction.dto';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from 'src/transactions/transaction';
import { WalletDto } from '../dto/wallet.dto';
import { Wallet } from '../wallet';

export class WalletMapper {
  static toWalletDto(wallet: Wallet): WalletDto {
    const walletDto = new WalletDto();
    walletDto.name = wallet.name;
    walletDto.publicKey = wallet.publicKey;

    return walletDto;
  }

  static toTransactionDto(transaction: Transaction): TransactionDto {
    const transactionDto = new TransactionDto();
    transactionDto.transactionId = transaction.transactionId;
    transactionDto.amount = transaction.amount;
    transactionDto.recipientPublicKey = transaction.recipientPublicKey;
    transactionDto.senderPublicKey = transaction.senderPublicKey;
    transactionDto.signature = transaction.signature;
    transactionDto.transactionFees = transaction.transactionFees;
    transactionDto.inputs = transaction.inputs.map((input) => {
      return this.toTransactionInputDto(input);
    });
    transactionDto.outputs = transaction.outputs.map((output) => {
      return this.toTransactionOutputDto(output);
    });
    return transactionDto;
  }

  static toTransactionInputDto(
    transactionInput: TransactionInput,
  ): TransactionInputDto {
    const transactionInputDto = new TransactionInputDto();
    transactionInputDto.transactionOutputId =
      transactionInput.transactionOutputId;
    transactionInputDto.UTXO = this.toTransactionOutputDto(
      transactionInput.UTXO,
    );
    return transactionInputDto;
  }

  static toTransactionOutputDto(
    transactionOutput: TransactionOutput,
  ): TransactionOutputDto {
    const transactionOutputDto = new TransactionOutputDto();
    transactionOutputDto.amount = transactionOutput.amount;
    transactionOutputDto.id = transactionOutput.id;
    transactionOutputDto.parentTransactionId =
      transactionOutput.parentTransactionId;
    transactionOutputDto.recipientPublicKey =
      transactionOutput.recipientPublicKey;
    return transactionOutputDto;
  }
}
