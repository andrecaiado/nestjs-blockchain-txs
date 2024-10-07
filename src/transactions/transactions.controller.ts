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

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject()
    private readonly transactionsService: TransactionsService,
  ) {}

  @ApiOperation({
    summary: 'Submit transaction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The transaction was submitted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `Transaction signature is invalid.\t\nThere are UTXOs in the inputs that do not belong to the sender.`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: `There are UTXOs that are not unspent.\t\nInputs are not enough to cover the outputs.`,
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  submitTransaction(@Body() transactionDto: TransactionDto): string {
    return this.transactionsService.submitTransaction(transactionDto);
  }
}
