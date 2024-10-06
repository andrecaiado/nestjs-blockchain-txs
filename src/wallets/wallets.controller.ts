import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from 'src/transactions/transaction';
import { WalletDto } from './dto/wallet.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Wallet } from './wallet';
import { TransactionDto } from 'src/transactions/dto/transaction.dto';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOperation({
    summary: 'Create wallet',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The wallet was successfully created.',
    type: WalletDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Wallet with the supplied name already exists.',
  })
  @HttpCode(HttpStatus.OK)
  @Post()
  createWallet(@Body() createWalletDto: CreateWalletDto): WalletDto {
    return this.walletsService.createWallet(createWalletDto);
  }

  @ApiOperation({
    summary: 'Get wallets',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The wallets were successfully retrieved or returns an empty list.',
    type: [WalletDto],
  })
  @HttpCode(HttpStatus.OK)
  @Get()
  getWallets(): WalletDto[] {
    return this.walletsService.getWallets();
  }

  @ApiOperation({
    summary: 'Get wallet by public key',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The wallet was successfully retrieved.',
    type: WalletDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: `Wallet with the supplied public key was not found.`,
  })
  @HttpCode(HttpStatus.OK)
  @Get(':publicKey')
  getWallet(@Param('publicKey') publicKey: string): WalletDto {
    return this.walletsService.getWallet(publicKey);
  }

  @ApiOperation({
    summary: 'New transaction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The new transaction was created successfully.',
    type: TransactionDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: `Sender wallet with the supplied public key was not found.\t\nRecipient wallet with the supplied public key was not found.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Sender and recipient wallets cannot be the same.\t\nThe sender wallet has insufficient balance to fund the transaction.`,
  })
  @HttpCode(HttpStatus.OK)
  @Post(':publicKey/transactions')
  createTransaction(
    @Param('publicKey') publicKey: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ): TransactionDto {
    return this.walletsService.createTransaction(
      publicKey,
      createTransactionDto,
    );
  }
}
