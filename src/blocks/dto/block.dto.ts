import { Transaction } from 'src/transactions/transaction';

export class BlockDto {
  id: number;
  transactions: Transaction[];
  hash: string;
  previousHash: string;
  nonce: number;
  timestamp: string;
  data: string;
}
