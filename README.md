# NestJS Blockchain and Cryptocurrency transactions

A NestJS project that demonstrates (generally) how blockchain works in the context of cryptocurrency transactions.

## Disclaimer

This project is not intended to be a full implementation of a blockchain network. It is a conceptualization of how blockchain works in the context of cryptocurrency transactions. Thus, most of the concepts are simplified and not compliant with the real-world blockchain networks.

# Getting started

This section provides a step-by-step guide on how to run the project.

## Requirements

To run this project, you will need to have the following installedon your local machine:
- [Node.js](https://nodejs.org/en/download/package-manager)
- [Docker](https://docs.docker.com/engine/install/)
- [Docker compose](https://docs.docker.com/compose/install/)

## Installing and running the project

1. Clone the repository
```shell
git clone git@github.com:andrecaiado/nestjs-blockchain-txs.git
```

2. Navigate into the project directory
```shell
cd your-repository-name
```

3. Install the dependencies
```shell
npm install
```

4. Start RabbitMQ with Docker Compose
```shell
docker compose up -d
```

5. Run the application
```shell 
npm run start:dev
```

## Try it out with Swagger UI

The Swagger UI is available at: [http://localhost:3000/api](http://localhost:3000/api)

To better understand how the API works, please refer to the following guide: [API guide](./docs/api-guide.md)

# Contents

To understand how this project was conceptualized and implemented, please refer to the following sections.

- [Conceptualization](./docs/conceptualization.md)
- [Implementation](#implementation)
