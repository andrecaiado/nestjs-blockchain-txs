# Dependencies and Configurations

This page describes the dependencies used in the project and how the configurations and supporting services are set up.

## Contents
- [Dependencies](#dependencies)
- [Configurations](#configurations)
  - [Environment variables and configuration service](#environment-variables-and-configuration-service)
  - [RabbitMQ containerized service configuration](#rabbitmq-containerized-service-configuration)

## Dependencies

Beside the NestJS dependencies, the following additional dependencies were used:

- [coinkey](https://www.npmjs.com/package/coinkey): Used to generate the public and private keys for the wallets.
- [ecpair](https://www.npmjs.com/package/ecpair) and [tiny-secp256k1](https://www.npmjs.com/package/tiny-secp256k1): Used to sign the transactions and verify the signatures.
- [@golevelup/nestjs-rabbitmq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq): Used to establish the RabbitMQ connection and publish and consume messages to and from the RabbitMQ exchanges and queues.
- [@willsoto/nestjs-prometheus](https://www.npmjs.com/package/@willsoto/nestjs-prometheus): Used to integrates Prometheus with the application.
- [prom-client](https://www.npmjs.com/package/prom-client): Is a Node.js client for Prometheus used to provide tools to collect and expose metrics that Prometheus can scrape.

## Configurations

This section describes how the configurations and supporting services are set up.

### Environment variables and configuration service

Some application properties are specified as environment variables in the `.env` file. These properties are loaded into the [config](../src/config/config.ts) constant and are made avaiable to the application through the NestJS `configuration service` as configured in the [app module](../src/app.module.ts).

The .env file contains the following properties:
| Property | Description | Default Value |
| --- | --- | --- |
| MINER_REWARD | The reward for the miner for mining a block | 50 |
| TRANSACTION_FEES | The fee for the transaction | 0.001 |
| MINING_DIFFICULTY | The number of leading zeros that a block hash must have to be mined | 2 |
| GENESIS_BLOCK_HASH | The genesis block hash | '0' |
| GENESIS_BLOCK_DATA | The genesis block data | 'Genesis Block' |
| GENESIS_TX_AMOUNT | The amount of coins in the genesis transaction | 1000 |
| MAX_COIN_SUPPLY | The maximum number of coins that can be mined | 1000000 |
| RABBITMQ_URL | The RabbitMQ connection URL | amqp://guest:guest@localhost:5672 |
| RABBITMQ_EXCHANGE_NAME_GLOBAL_TX_POOL | The name of the exchange to where the transactions are published after being submitted and validated. | 'global-tx-pool-exchange' |
| RABBITMQ_EXCHANGE_NAME_BLOCKS_ANNOUNCEMENT_POOL | The name of the exchange to where the blocks are published after being mined. | 'blocks-announcement-pool-exchange' |
| RABBITMQ_QUEUE_NAME_MINER_MEMPOOL | The name of the queue from where the miner will consume transactions. This queue will be bound to `global-tx-pool-exchange`. | 'miner-mempool-queue' |
| RABBITMQ_QUEUE_NAME_MINER_POOL_ANNOUNCED_BLOCKS | The name of the queue from where the miner will consume blocks in order to validate them and add them to the blockchain. This queue will be bound to `blocks-announcement-pool-exchange`. | 'miner-pool-announced-blocks-queue' |

If the `.env` file is not present or the properties are not set, the default values specified in the [config](../src/config/config.ts) constant will be used.

### RabbitMQ containerized service configuration

The RabbitMQ service runs in a container and is configured and started using the docker compose file [docker-compose.yaml](../docker-compose.yaml).

The docker compose file specifies 2 files to be mounted to the container: 
- [rabbitmq.config](../rabbitmq/rabbitmq.conf): This file is used to set the `definitions.json` file location.
- [definitions.json](../rabbitmq/definitions.json): This file contains configurations that will automatically be applied when RabbitMQ starts. The configurations include the user credentials and the exchanges and queues (and the binding between them).

> [!NOTE]**About the `definitions.json` file**: 
> The exchanges and queues names defined in the `definitions.json` file must match the exchanges and queues names specified in the `.env` file otherwise the application will not work as expected.

The RabbitMQ management console is available at `http://localhost:15672`. The user credentials are:
- Username: admin 
- Password: admin

> [!NOTE]**About the user credentials**: 
> The way the RabbitMQ service user credentials are configured is not recommended for production because these credentials are hardcoded in the `definitions.json` file. In a production environment, the user credentials should be passed as environment variables to the RabbitMQ service.
