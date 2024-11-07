import { Transaction } from 'src/transactions/transaction';

export class Block {
  transactions: Transaction[];
  hash: string;
  previousHash;
  nonce: number;
  timestamp: Date;

  constructor(
    transactions: Transaction[],
    hash: string,
    previousHash: string,
    nonce: number,
    timestamp: Date,
  ) {
    this.transactions = transactions;
    this.hash = hash;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.timestamp = timestamp;
  }
}
