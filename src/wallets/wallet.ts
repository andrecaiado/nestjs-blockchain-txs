import * as coinKey from 'coinkey';

export class Wallet {
  publicKey: string;
  privateKey: string;
  name: string;

  constructor(name: string) {
    const key = coinKey.createRandom();
    this.name = name;
    this.publicKey = key.publicKey.toString('hex');
    this.privateKey = key.privateKey.toString('hex');
  }
}
