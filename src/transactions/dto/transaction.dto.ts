import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class TransactionDto {
  @IsNotEmpty()
  @IsString()
  transactionId: string;

  @IsNotEmpty()
  @IsString()
  senderPublicKey: string;

  @IsNotEmpty()
  @IsString()
  recipientPublicKey: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  inputs: TransactionInputDto[];

  @IsNotEmpty()
  outputs: TransactionOutputDto[];

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  transactionFees: number;
}

export class TransactionOutputDto {
  @IsNotEmpty()
  @IsString()
  recipientPublicKey: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsString()
  parentTransactionId: string;

  @IsNotEmpty()
  @IsString()
  id: string;
}

export class TransactionInputDto {
  @IsNotEmpty()
  @IsString()
  transactionOutputId: string;

  @IsNotEmpty()
  UTXO: TransactionOutputDto;
}
