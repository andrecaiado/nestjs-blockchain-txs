import * as coinKey from 'coinkey';

export class Wallet {
  private publicKey: string;
  private privateKey: string;
  private name: string;

  constructor(name: string) {
    const key = coinKey.createRandom();
    this.publicKey = key.publicAddress;
    this.privateKey = key.privateKey.toString('hex');
    this.name = name;
  }

  public getPublicKey(): string {
    return this.publicKey;
  }

  public getName(): string {
    return this.name;
  }
}
