import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  createWallet(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.createWallet(createWalletDto);
  }

  @Get()
  getWallets() {
    return this.walletsService.getWallets();
  }

  @Get(':publicKey')
  getWallet(@Param('publicKey') publicKey: string) {
    return this.walletsService.getWallet(publicKey);
  }
}
