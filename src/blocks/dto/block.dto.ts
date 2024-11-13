import { TransactionDto } from 'src/transactions/dto/transaction.dto';

export class BlockDto {
  id: number;
  transactions: TransactionDto[];
  hash: string;
  previousHash: string;
  nonce: number;
  timestamp: string;
  data: string;
}
