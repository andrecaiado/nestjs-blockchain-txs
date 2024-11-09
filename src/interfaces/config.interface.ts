interface BlockchainConfigProps {
  minerReward: number;
  miningDifficulty: number;
  transactionFees: number;
  genesisBlock: {
    hash: string;
    data: string;
  };
  genesisTransaction: {
    amount: number;
  };
  maxCoinSupply: number;
}

interface RabbitMQConfigProps {
  exchanges: [
    {
      name: string;
      type: string;
      options?: Record<string, any>;
    },
    {
      name: string;
      type: string;
      options?: Record<string, any>;
    },
  ];
  queues: [
    {
      name: string;
    },
    {
      name: string;
    },
  ];
  uri: string;
}

export interface ConfigProps {
  blockchain: BlockchainConfigProps;
  rabbitmq: RabbitMQConfigProps;
}
