import { generateKeyPairSync, KeyPairSyncResult } from 'crypto';

export class Wallet {
  //private keyPair: KeyPairSyncResult<string, string>;
  private publicKey: string;
  private privateKey: string;
  private name: string;

  constructor(name: string, passphrase: string) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 256,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: passphrase,
      },
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.name = name;
  }
}
