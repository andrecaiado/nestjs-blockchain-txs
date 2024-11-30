import { BlockMapper } from 'src/blocks/block.mapper';
import { Blockchain } from './blockchain';
import { BlockchainDto } from './dto/blockchain.dto';

export class BlockchainMapper {
  static toBlockchainDto(blockchain: Blockchain): BlockchainDto {
    const blockchainDto = {
      status: {
        totalTransactions: blockchain.totalTxsBlockchain,
        totalBlocks: blockchain.chain.length,
        totalCoinsMined: blockchain.totalCoinsMined,
        totalAddresses: blockchain.totalAddresses,
        totalCoinsLeftToMine: blockchain.totalCoinsLeftToMine,
        isChainValid: blockchain.status,
      },
      chainPreview: blockchain.chain.map((block) =>
        BlockMapper.toBlockPreview(block),
      ),
    };
    return blockchainDto;
  }
}
