import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from 'src/transactions/transaction';
import { WalletDto } from './dto/wallet.dto';

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
  getWallet(@Param('publicKey') publicKey: string): WalletDto {
    return this.walletsService.getWallet(publicKey);
  }

  @Post(':publicKey/transactions')
  @HttpCode(200)
  createTransaction(
    @Param('publicKey') publicKey: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Transaction {
    return this.walletsService.createTransaction(
      publicKey,
      createTransactionDto,
    );
  }
}
