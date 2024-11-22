import { Block } from 'src/blocks/block';

export class Blockchain {
  chain: Block[] = [];

  isChainValid(): boolean {
    if (this.chain.length === 1) {
      return true;
    }
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      return currentBlock.isValid(previousBlock);
    }
  }
}
