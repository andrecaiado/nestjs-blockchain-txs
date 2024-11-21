export class BlockPreview {
  blockId: number;
  timestamp: string;
  totalTransactions: number;
}

export class BlockchainStatus {
  totalTransactions: number = 0;
  totalBlocks: number = 0;
  totalCoinsMined: number = 0;
  totalAddresses: number = 0;
  totalCoinsLeftToMine: number = 0;
  isChainValid: boolean = true;
}

export class BlockchainDto {
  status: BlockchainStatus;
  chainPreview: BlockPreview[] = [];
}
