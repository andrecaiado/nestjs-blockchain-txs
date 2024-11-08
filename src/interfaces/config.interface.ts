interface BlockchainConfigProps {
  minerReward: number;
  miningDifficulty: number;
  transactionFees: number;
  genesisBlock: {
    hash: string;
    nonce: number;
    data: string;
  };
  genesisTransaction: {
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
  queues: [
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
