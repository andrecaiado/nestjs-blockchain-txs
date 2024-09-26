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
      this.inputs.toString() +
      this.outputs.toString()
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

export class TransactionOutput {
  recipientPublicKey: string;
  amount: number;
  parentTransactionId: string;
  id: string;

  toString(): string {
    return (
      this.recipientPublicKey + this.amount + this.parentTransactionId + this.id
    );
  }
}
