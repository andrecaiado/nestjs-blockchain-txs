import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  recipientPublicKey: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
