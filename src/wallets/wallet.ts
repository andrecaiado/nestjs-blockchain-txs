import * as coinKey from 'coinkey';
import { WalletType } from 'src/enums/wallet-type.enum';

export class Wallet {
  publicKey: string;
  privateKey: string;
  name: string;
  type: WalletType;

  constructor(name: string, type: WalletType) {
    const key = coinKey.createRandom();
    this.name = name;
    this.publicKey = key.publicKey.toString('hex');
    this.privateKey = key.privateKey.toString('hex');
    this.type = type;
  }
}
