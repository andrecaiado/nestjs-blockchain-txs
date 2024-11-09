import { Transaction } from 'src/transactions/transaction';

export class Block {
  id: number;
  transactions: Transaction[];
  hash: string;
  previousHash: string;
  nonce: number;
  timestamp: Date;
  data: string;

  toString(): string {
    return (
      this.transactions
        .map((transaction) => transaction.toString())
        .join('')
        .toString() +
      this.previousHash +
      this.nonce.toString() +
      this.timestamp.toString() +
      this.data
    );
  }
}
