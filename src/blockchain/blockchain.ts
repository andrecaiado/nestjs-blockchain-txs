import { Block } from 'src/blocks/block';

export class Blockchain {
  chain: Block[] = [];

  isChainValid(genesisBlockHash): boolean {
    let index = 0;
    while (index < this.chain.length) {
      const currentBlock = this.chain[index];

      if (index === 0) {
        // Genesis block
        if (!currentBlock.isValid(undefined, genesisBlockHash)) {
          return false;
        }
      } else {
        // Other blocks
        const previousBlock = this.chain[index - 1];
        if (!currentBlock.isValid(previousBlock, undefined)) {
          return false;
        }
      }

      index++;
    }
    return true;
  }
}
