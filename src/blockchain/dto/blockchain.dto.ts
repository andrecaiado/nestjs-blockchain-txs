export class BlockPreview {
  blockId: string;
  timestamp: number;
  totalTransactions: number;
}

export class BlockchainDto {
  totalTransactions: number = 0;
  totalBlocks: number = 0;
  totalCoins: number = 0;
  totalAddresses: number = 0;
  chainPreview: BlockPreview[] = [];
}
