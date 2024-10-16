# Implementation

In this section, there will be a brief explanation of how the concepts were implemented.

## Contents
- [Dependencies](#dependencies)
- [Wallets](#wallets)
- [Transactions](#transactions)
- [Pools](#pools)
  - [Global transaction pool exchange](#global-transaction-pool-exchange)
- [RabbitMQ](#rabbitmq)
- [Configuration Service](#configuration-service)

# Dependencies

Beside the NestJS dependencies, the following additional dependencies were used:

- [coinkey](https://www.npmjs.com/package/coinkey): Used to generate the public and private keys for the wallets.
- [ecpair](https://www.npmjs.com/package/ecpair) and [tiny-secp256k1](https://www.npmjs.com/package/tiny-secp256k1): Used to sign the transactions and verify the signatures.
- [@golevelup/nestjs-rabbitmq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq): Used to establish the RabbitMQ connection and publish and consume messages to and from the RabbitMQ exchanges and queues.

# Wallets

A wallet is represented by the [Wallet](../src/wallets/wallet.ts) class.

When creating a wallet, the constructor will generate the wallet's public and a private key using the `coinkey` library.

```typescript
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
  ...
}
```

The wallet operations are implemented in the [WalletService](../src/wallets/wallets.service.ts) class.

The main operation of the wallet service is implemented by the `createTransaction` function. This function is responsible for validating the transaction request and building the transaction with all the necessary data to transfer funds from one wallet to another.

The `WalletService` fetches the sender wallet's UTXOs from the [BlockchainService](../src/blockchain/blockchain.service.ts). These UTXOs are used to verify if the sender has enough funds for the transaction and also to build the transaction inputs.

# Transactions

A transaction is represented by the [Transaction](../src/transactions/transaction.ts) class.

The most interesting attributes in the `Transaction` class are the `inputs (TransactionInput)` and `outputs (TransactionOutput)`.

```typescript
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
```

An input always refers to a previous output. In order to be added in a transaction, that output must be unspent, that's why it is refered as a `UTXO (Unspent Transaction Output)`.

The [TransactionService](../src/transactions/transactions.service.ts) `submitTransaction` function processes the transaction submitted (POST) to the `/transactions` endpoint.

Before publishing the transaction to the `global-tx-pool-exchange`, it validates the transaction for the following:
- Check if the transaction signature is valid (using the sender public key).
- Validate the sender and recipients wallets exist.
- Validate if the inputs belong to the sender.
- Check if the inputs (UTXOs) are not already spent.
- Check if inputs are enough to cover the outputs.

# Pools

All pools are implemented as RabbitMQ exchanges and queues. The pools are:
- Global transaction pool
- Miner mempool
- Block announcement pool
- Miner pool for announced blocks

## Global transaction pool exchange

The `global-tx-pool-exchange` is a RabbitMQ exchange of type `fanout`. This means that the messages published to the exchange will be routed to the all the queues bounded to the exchange.

In this project, the only queue bounded to the exchange is the `miner-mempool-queue`.

The `publish` function to the exchange is implemented in the [PoolsService](../src/pools/pools.service.ts).

# RabbitMQ

The RabbitMQ external service is defined in the [docker-compose.yaml](../docker-compose.yaml) file. 

There are default configurations configured in the [definitions.json](../rabbitmq/definitions.json) file. The configurations are:
- A user `admin` with password `admin` and tags `administrator`.
- A virtual host `/` with the user `admin` having all permissions.
- An exchange `global-tx-pool-exchange` of type `fanout`.
- A queue `miner-mempool-queue` bounded to the `global-tx-pool-exchange`.

These configurations are applied when the RabbitMQ container is started because the files `rabbitmq.conf` and `definitions.json` are being mounted to a specific directory in the `rabbitmq` container. The files mounting is defined in the `docker-compose.yaml` file.
 
```yaml
services:
  rabbitmq:
    ...
    volumes:
      - './rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro'
      - './rabbitmq/definitions.json:/etc/rabbitmq/definitions.json:ro'
...
```

The RabbitMQ connection is established in the [PoolsModule](../src/pools/pools.module.ts) file usinf the `@golevelup/nestjs-rabbitmq` library. The configuration properties are read from the ConfigService.

There is a conditional configuration for the RabbitMQ connection, where the connection is not established when the environment is `test`.

```typescript
@Module({
  imports: [
    RabbitMQModule.forRootAsync(
      RabbitMQModule,
      process.env.NODE_ENV !== 'test'
        ? {
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => config.get('rabbitmq'),
            inject: [ConfigService],
          }
        : undefined,
    ),
  ],
  ...
})
export class PoolsModule {}
```

# Configuration Service
