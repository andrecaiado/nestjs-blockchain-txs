# Implementation

In this section, there will be a brief explanation of how the concepts were implemented.

## Contents
- [Dependencies](#dependencies)
- [Wallets](#wallets)
- [Transactions](#transactions)
- [Pools](#pools)
  - [Global transaction pool exchange](#global-transaction-pool-exchange)
  - [Miner mempool queue](#miner-mempool-queue)
- [Mining Service](#mining-service)
- [Block](#block)
- [Blockchain](#blockchain)
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

The `publish` function is implemented in the [PoolsService](../src/pools/pools.service.ts). This function is used to publish a message to any exchange.

```typescript
public async publish(exchange: string, message: any): Promise<void> {
    console.log(
      `Pools service: Publishing message to exchange '${exchange}'...`,
    );

    const data = Buffer.from(JSON.stringify(message));
    this.amqpConnection.channel.publish(exchange, '', data, {});

    console.log(`Pools service: Message published to exchange '${exchange}'.`);
  }
```

## Miner mempool queue

The `miner-mempool-queue` is a RabbitMQ queue bounded to the `global-tx-pool-exchange`. This queue is used by the miners (the `mining service`) to fetch transactions to be included in the block.

In this project, the `miner-mempool-queue` is consumed by the [MiningService](../src/mining/mining.service.ts).

# Mining Service

The mining service is implemented in the [MiningService](../src/mining/mining.service.ts) class. This service is responsible for getting transactions from the `miner-mempool-queue`, validating the transactions, creating a block, mining the block, and broadcasting the mined block to the `block-announcement-pool-exchange`.

```typescript
@RabbitSubscribe({
  queue: 'miner-mempool-queue',
})
public async mempoolTxsHandler(msg: object): Promise<Block> {
  // Map msg to Transaction model
  ...
  // Validate transaction: are UTXOs still unspent?
  ...
  // Create new block
  ...
  // Mine block
  ...
  // Broadcast mined block
  ...
}
```

# Block

The block is represented by the [Block](../src/blocks/block.ts) class.

```typescript
export class Block {
  transactions: Transaction[];
  hash: string;
  previousHash;
  nonce: number;
  timestamp: Date;
}
```

The block service is implemented in the [BlockService](../src/blocks/blocks.service.ts) class. The `createBlock` function is responsible for creating the `genesis block` when the service is initialized and for creating new `blocks`.

# Blockchain

THIS SECTION WILL BE HEAVLY UPDATED

The blockchain is represented by the [Blockchain](../src/blockchain/blockchain.ts) class.

```typescript
export class Blockchain {
  chain: Block[];
}
```

The blockchain service is implemented in the [BlockchainService](../src/blockchain/blockchain.service.ts) class. The service is responsible for adding new blocks to the blockchain.

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
