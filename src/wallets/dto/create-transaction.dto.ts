import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  recipientPublicKey: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
