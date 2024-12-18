import { Block } from 'src/blocks/block';
import { BlockDto } from '../block.dto';
import { TransactionDtoMapper } from 'src/transactions/dto/mappers/transaction.dto.mapper';

export class BlockDtoMapper {
  static toBlock(blockDto: BlockDto): Block {
    const block = new Block();
    block.id = blockDto.id;
    block.transactions = blockDto.transactions.map((tx) =>
      TransactionDtoMapper.toTransaction(tx),
    );
    block.previousHash = blockDto.previousHash;
    block.hash = blockDto.hash;
    block.nonce = blockDto.nonce;
    block.timestamp = new Date(blockDto.timestamp).getTime();
    block.data = blockDto.data;
    return block;
  }
}
