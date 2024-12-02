# NestJS Blockchain and Cryptocurrency transactions

A NestJS project that demonstrates (conceptually) how blockchain works in the context of cryptocurrency transactions.

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

4. Create and update the .env file
```text
Create a copy of the `.env.template` and change the name to `.env`
Update the values (optional)
````

5. Start RabbitMQ with Docker Compose
```shell
docker compose up -d
```

6. Run the application
```shell 
npm run start:dev
```

## Try it out with Swagger UI

The Swagger UI is available at: [http://localhost:3000/api](http://localhost:3000/api)

To better understand how the API works, please refer to the following guide: [API guide](./docs/api-guide.md)

## Visualize the metrics dashboard

The metrics dahsboard in provided by Grafana and is available at: [http://localhost:3030](http://localhost:3030/d/de5cpk8oakhkwf/nestjs-blockchain-txs?orgId=1&from=now-6h&to=now&timezone=browser&refresh=5s)

# Contents

To understand how this project was conceptualized and which dependencies are used, please refer to the following sections.

- [Conceptualization](./docs/conceptualization.md)
- [Dependencies and Configurations](./docs/dependencies-configs.md)
