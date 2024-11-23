import { Transaction } from 'src/transactions/transaction';
import { createHash } from 'node:crypto';

export class Block {
  id: number;
  transactions: Transaction[];
  hash: string;
  previousHash: string;
  nonce: number;
  timestamp: number;
  data: string;

  toString(): string {
    return (
      this.id +
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

  calculateHash(): string {
    return createHash('sha256').update(this.toString()).digest('hex');
  }

  isValid(previousBlock?: Block, genesisBlockHash?: string): boolean {
    if (this.id === 0) {
      // Genesis block
      if (this.hash !== genesisBlockHash) {
        return false;
      }
    } else {
      // Other blocks
      if (this.hash !== this.calculateHash()) {
        return false;
      } else if (this.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}
