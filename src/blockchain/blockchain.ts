export class Blockchain {
  //private chain: Block[] = [];
  private difficulty = 2;
  private miningReward = 100;

  constructor() {
    //this.createGenesisBlock();
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
