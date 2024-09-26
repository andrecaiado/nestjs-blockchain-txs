interface BlockchainConfigProps {
  mineReward: number;
  miningDifficulty: number;
  transactionFees: number;
  genesisBlock: {
    hash: string;
    nonce: number;
    data: string;
    amount: number;
  };
}

export interface ConfigProps {
  blockchain: BlockchainConfigProps;
}
