export class Transaction {
  transactionId: string;
  senderPublicKey: string;
  recipientPublicKey: string;
  amount: number;
  signature: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}

export class TransactionInput {
  transactionOutputId: string;
  UTXO: TransactionOutput;
}

export class TransactionOutput {
  recipientPublicKey: string;
  amount: number;
  parentTransactionId: string;
  id: string;
}
