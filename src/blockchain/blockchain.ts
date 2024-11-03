import { Block } from 'src/blocks/block';

export class Blockchain {
  private chain: Block[] = [];

  constructor() {
    //this.createGenesisBlock();
  }

  public getChain() {
    return this.chain;
  }

  // public createGenesisBlock(): void {
  //   const genesisBlock = new Block(
  //     '0',
  //     new Date(),
  //     [],
  //     '0'.repeat(this.difficulty),
  //   );
  //   this.chain.push(genesisBlock);
  // }
}
