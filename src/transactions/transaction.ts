import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash } from 'node:crypto';

export class Transaction {
  transactionId: string;
  senderPublicKey: string;
  recipientPublicKey: string;
  amount: number;
  signature: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  transactionFees: number;

  toString(): string {
    return (
      this.transactionId +
      this.senderPublicKey +
      this.recipientPublicKey +
      this.amount.toString() +
      this.transactionFees.toString() +
      this.inputs
        .map((input) => input.toString())
        .join('')
        .toString() +
      this.outputs
        .map((output) => output.toString())
        .join('')
        .toString()
    );
  }

  verifySignature(publicKey: string): boolean {
    const hash = createHash('sha256').update(this.toString()).digest();
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
    return keyPair.verify(hash, Buffer.from(this.signature, 'hex'));
  }

  sign(privateKey: string): string {
    const hash = createHash('sha256').update(this.toString()).digest();
    const ECPair = ECPairFactory(ecc);
    const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    const signature = keyPair.sign(hash);
    return Buffer.from(signature).toString('hex');
  }
}

export class TransactionOutput {
  recipientPublicKey: string;
  amount: number;
  parentTransactionId: string;
  id: string;

  toString(): string {
    return (
      this.recipientPublicKey +
      this.amount.toString() +
      this.parentTransactionId +
      this.id
    );
  }
}

export class TransactionInput {
  transactionOutputId: string;
  UTXO: TransactionOutput;

  toString(): string {
    return this.transactionOutputId + this.UTXO.toString();
  }
}
