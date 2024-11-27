import { ConfigProps } from 'src/interfaces/config.interface';

export const config = (): ConfigProps => ({
  blockchain: {
    minerReward: parseFloat(process.env.MINE_REWARD) || 50,
    miningDifficulty: parseInt(process.env.MINING_DIFFICULTY, 10) || 4,
    transactionFees: parseFloat(process.env.TRANSACTION_FEES) || 0.001,
    genesisBlock: {
      hash: process.env.GENESIS_BLOCK_HASH || '0',
      data: process.env.GENESIS_BLOCK_DATA || 'Genesis Block',
    },
    genesisTransaction: {
      amount: parseFloat(process.env.GENESIS_TX_AMOUNT) || 1000,
    },
    maxCoinSupply: parseFloat(process.env.MAX_COIN_SUPPLY) || 1000000,
  },
  rabbitmq: {
    exchanges: [
      {
        name:
          process.env.RABBITMQ_EXCHANGE_NAME_GLOBAL_TX_POOL ||
          'global-tx-pool-exchange',
        type: 'fanout',
        options: {
          durable: 'true',
        },
      },
      {
        name:
          process.env.RABBITMQ_EXCHANGE_NAME_BLOCKS_ANNOUNCEMENT_POOL ||
          'blocks-announcement-pool-exchange',
        type: 'fanout',
        options: {
          durable: 'true',
        },
      },
    ],
    queues: [
      {
        name:
          process.env.RABBITMQ_QUEUE_NAME_MINER_MEMPOOL ||
          'miner-mempool-queue',
      },
      {
        name:
          process.env.RABBITMQ_QUEUE_NAME_MINER_BLOCK_ANNOUNCE ||
          'miner-pool-announced-blocks-queue',
      },
    ],
    uri: process.env.RABBITMQ_URI || 'amqp://admin:admin@localhost:5672',
  },
});
