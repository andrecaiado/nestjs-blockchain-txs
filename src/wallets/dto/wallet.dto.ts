import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WalletType } from 'src/enums/wallet-type.enum';

export class WalletDto {
  @ApiProperty({ description: 'The wallet public key' })
  publicKey: string;

  @ApiProperty({ description: 'The wallet name' })
  name: string;

  @ApiProperty({ description: 'The wallet balance' })
  balance: number;

  @ApiProperty({ description: 'The wallet type' })
  @IsEnum(WalletType)
  type: WalletType;
}
