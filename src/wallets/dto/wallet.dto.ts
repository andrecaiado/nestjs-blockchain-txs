import { ApiProperty } from '@nestjs/swagger';

export class WalletDto {
  @ApiProperty({ description: 'The wallet public key' })
  publicKey: string;

  @ApiProperty({ description: 'The wallet name' })
  name: string;

  @ApiProperty({ description: 'The wallet balance' })
  balance: number;
}
