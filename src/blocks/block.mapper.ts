import { BlockPreview } from 'src/blockchain/dto/blockchain.dto';
import { Block } from './block';
import { BlockDto } from './dto/block.dto';
import { WalletMapper } from 'src/wallets/mappers/wallet.mapper';

export class BlockMapper {
  static toBlockPreview(block: Block): BlockPreview {
    const blockPreview = new BlockPreview();
    blockPreview.blockId = block.id;
    blockPreview.timestamp = new Date(block.timestamp).toISOString();
    blockPreview.totalTransactions = block.transactions.length;
    return blockPreview;
  }

  static toBlockDto(block: Block): BlockDto {
    return {
      id: block.id,
      transactions: block.transactions.map((tx) =>
        WalletMapper.toTransactionDto(tx),
      ),
      hash: block.hash,
      previousHash: block.previousHash,
      nonce: block.nonce,
      timestamp: new Date(block.timestamp).toISOString(),
      data: block.data,
    };
  }
}
