import { Injectable } from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  public createWallet(createWalletDto: CreateWalletDto): Wallet {
    return new Wallet(createWalletDto.name);
  }
}
