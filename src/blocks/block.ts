import { Transaction } from 'src/transactions/transaction';

export class Block {
  private transactions: Transaction[];
  private hash: string;
  private previousHash;
  private nonce: number;
  private timestamp: Date;
}
