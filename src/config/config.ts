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
});
