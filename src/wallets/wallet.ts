import * as coinKey from 'coinkey';

export class Wallet {
  publicKey: string;
  privateKey: string;
  name: string;
  isMiner: boolean;

  constructor(name: string, isMiner: boolean) {
    const key = coinKey.createRandom();
    this.name = name;
    this.publicKey = key.publicKey.toString('hex');
    this.privateKey = key.privateKey.toString('hex');
    this.isMiner = isMiner;
  }
}
