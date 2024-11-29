import { Block } from 'src/blocks/block';

export class Blockchain {
  chain: Block[] = [];
  totalTxsBlockchain: number = 0;
  totalCoinsMined: number = 0;
  totalCoinsLeftToMine: number = 0;
  totalAddresses: number = 0;
  status: boolean;

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
