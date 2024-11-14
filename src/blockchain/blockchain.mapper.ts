import { BlockMapper } from 'src/blocks/block.mapper';
import { Blockchain } from './blockchain';
import { BlockchainDto } from './dto/blockchain.dto';

export class BlockchainMapper {
  static toBlockchainDto(
    blockchain: Blockchain,
    totalUtxos: number,
    maxCoinSupply: number,
  ): BlockchainDto {
    const addresses = new Set();
    blockchain.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        transaction.outputs.forEach((output) => {
          addresses.add(output.recipientPublicKey);
        });
      });
    });
    const blockchainDto = {
      status: {
        totalTransactions: blockchain.chain.reduce(
          (total, block) => total + block.transactions.length,
          0,
        ),
        totalBlocks: blockchain.chain.length,
        totalCoinsMined: totalUtxos,
        totalAddresses: addresses.size,
        totalCoinsLeftToMine: maxCoinSupply - totalUtxos,
      },
      chainPreview: blockchain.chain.map((block) =>
        BlockMapper.toBlockPreview(block),
      ),
    };
    return blockchainDto;
  }
}
