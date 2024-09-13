import { Body, Controller, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  createWallet(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.createWallet(createWalletDto);
  }
}
