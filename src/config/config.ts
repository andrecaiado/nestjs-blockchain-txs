import { ConfigProps } from 'src/interfaces/config.interface';

export const config = (): ConfigProps => ({
  blockchain: {
    minerReward: parseFloat(process.env.MINE_REWARD) || 50,
    miningDifficulty: parseInt(process.env.MINING_DIFFICULTY, 10) || 2,
    transactionFees: parseFloat(process.env.TRANSACTION_FEES) || 0.001,
    genesisBlock: {
      hash: process.env.GENESIS_BLOCK_HASH || '0',
      data: process.env.GENESIS_BLOCK_DATA || 'Genesis Block',
    },
    genesisTransaction: {
      amount: parseFloat(process.env.GENESIS_TX_AMOUNT) || 0,
    },
    maxCoinSupply: parseFloat(process.env.MAX_COIN_SUPPLY) || 1000000,
  },
  rabbitmq: {
    exchanges: [
      {
        name:
          process.env.RABBITMQ_EXCHANGE_NAME_GLOBAL_TX_POOL ||
          'global-tx-pool-exchange',
        type: process.env.RABBITMQ_EXCHANGE_TYPE_GLOBAL_TX_POOL || 'direct',
        options: {
          durable:
            process.env.RABBITMQ_EXCHANGE_DURABLE_GLOBAL_TX_POOL === 'true',
        },
      },
      {
        name:
          process.env.RABBITMQ_EXCHANGE_NAME_BLOCKS_ANNOUNCEMENT_POOL ||
          'blocks-announcement-pool-exchange',
        type:
          process.env.RABBITMQ_EXCHANGE_TYPE_BLOCKS_ANNOUNCEMENT_POOL ||
          'direct',
        options: {
          durable:
            process.env.RABBITMQ_EXCHANGE_DURABLE_BLOCKS_ANNOUNCEMENT_POOL ===
            'true',
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
    uri: process.env.RABBITMQ_URI || 'amqp://localhost',
  },
});
