export class BlockPreview {
  blockId: number;
  timestamp: number;
  totalTransactions: number;
}

export class BlockchainStatus {
  totalTransactions: number = 0;
  totalBlocks: number = 0;
  totalCoins: number = 0;
  totalAddresses: number = 0;
}

export class BlockchainDto {
  status: BlockchainStatus;
  chainPreview: BlockPreview[] = [];
}
