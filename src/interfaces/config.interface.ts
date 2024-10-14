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

interface RabbitMQConfigProps {
  exchanges: [
    {
      name: string;
      type: string;
      options?: Record<string, any>;
    },
  ];
  uri: string;
}

export interface ConfigProps {
  blockchain: BlockchainConfigProps;
  rabbitmq: RabbitMQConfigProps;
}
