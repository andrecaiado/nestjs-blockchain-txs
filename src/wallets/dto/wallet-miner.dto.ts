import { OmitType } from '@nestjs/swagger';
import { WalletDto } from './wallet.dto';

export class WalletMinerDto extends OmitType(WalletDto, [
  'publicKey',
] as const) {}
