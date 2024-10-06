import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'The public key of the wallet that will receive the funds',
  })
  @IsNotEmpty()
  @IsString()
  recipientPublicKey: string;

  @ApiProperty({
    description: 'The amount to transfer',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
