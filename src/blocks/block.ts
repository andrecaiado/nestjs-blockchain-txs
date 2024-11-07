import { Transaction } from 'src/transactions/transaction';

export class Block {
  transactions: Transaction[];
  hash: string;
  previousHash;
  nonce: number;
  timestamp: Date;
}
