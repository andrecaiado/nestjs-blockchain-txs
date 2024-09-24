import * as coinKey from 'coinkey';

export class Wallet {
  private publicKey: string;
  private privateKey: string;
  private name: string;

  constructor(name: string) {
    const key = coinKey.createRandom();
    this.name = name;
    this.publicKey = key.publicKey.toString('hex');
    this.privateKey = key.privateKey.toString('hex');
  }

  public getPublicKey(): string {
    return this.publicKey;
  }

  public getName(): string {
    return this.name;
  }

  public getPrivateKey(): string {
    return this.privateKey;
  }
}
