import { BlockPreview } from 'src/blockchain/dto/blockchain.dto';
import { Block } from './block';

export class BlockMapper {
  static toBlockPreview(block: Block): BlockPreview {
    const blockPreview = new BlockPreview();
    blockPreview.blockId = block.id;
    blockPreview.timestamp = new Date(block.timestamp).getTime();
    blockPreview.totalTransactions = block.transactions.length;
    return blockPreview;
  }
}
