import { Body, Controller, Inject, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject()
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  submitTransaction(@Body() transactionDto: TransactionDto): string {
    return this.transactionsService.submitTransaction(transactionDto);
  }
}
