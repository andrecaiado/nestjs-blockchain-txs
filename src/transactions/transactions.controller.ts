import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './dto/transaction.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetricsService } from 'src/metrics/metrics.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject() private readonly transactionsService: TransactionsService,
    @Inject() private readonly metricsService: MetricsService,
  ) {}

  @ApiOperation({
    summary: 'Submit transaction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The transaction was submitted successfully.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  submitTransaction(@Body() transactionDto: TransactionDto) {
    try {
      return this.transactionsService.submitTransaction(transactionDto);
    } catch (error) {
      this.metricsService.incTotalTxsRejected();
      throw error;
    }
  }
}
