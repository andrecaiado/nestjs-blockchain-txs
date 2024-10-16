import { ConfigProps } from 'src/interfaces/config.interface';

export const config = (): ConfigProps => ({
  blockchain: {
    mineReward: parseFloat(process.env.MINE_REWARD) || 50,
    miningDifficulty: parseInt(process.env.MINING_DIFFICULTY, 10) || 2,
    transactionFees: parseFloat(process.env.TRANSACTION_FEES) || 0.001,
    genesisBlock: {
      hash: process.env.GENESIS_BLOCK_HASH || '0',
      nonce: parseInt(process.env.GENESIS_BLOCK_NONCE, 10) || 0,
      data: process.env.GENESIS_BLOCK_DATA || 'Genesis Block',
      amount: parseFloat(process.env.GENESIS_BLOCK_AMOUNT) || 0,
    },
  },
  rabbitmq: {
    exchanges: [
      {
        name: process.env.RABBITMQ_EXCHANGE_NAME_GLOBAL_TX_POOL || 'blockchain',
        type: process.env.RABBITMQ_EXCHANGE_TYPE_GLOBAL_TX_POOL || 'direct',
        options: {
          durable:
            process.env.RABBITMQ_EXCHANGE_DURABLE_GLOBAL_TX_POOL === 'true',
        },
      },
    ],
    uri: process.env.RABBITMQ_URI || 'amqp://localhost',
  },
});
