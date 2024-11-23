# Dependencies

Beside the NestJS dependencies, the following additional dependencies were used:

- [coinkey](https://www.npmjs.com/package/coinkey): Used to generate the public and private keys for the wallets.
- [ecpair](https://www.npmjs.com/package/ecpair) and [tiny-secp256k1](https://www.npmjs.com/package/tiny-secp256k1): Used to sign the transactions and verify the signatures.
- [@golevelup/nestjs-rabbitmq](https://www.npmjs.com/package/@golevelup/nestjs-rabbitmq): Used to establish the RabbitMQ connection and publish and consume messages to and from the RabbitMQ exchanges and queues.