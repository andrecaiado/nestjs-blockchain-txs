import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { Block } from 'src/blocks/block';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a genesis block', () => {
    const genesisBlock: Block = {
      id: 0,
      transactions: [],
      hash: '0',
      previousHash: '0',
      nonce: 0,
      timestamp: new Date(),
    };
    service.addGenesisBlock(genesisBlock);

    expect(service.getLastBlock()).toEqual(genesisBlock);
  });

  it('should get the last block', () => {
    const genesisBlock: Block = {
      id: 0,
      transactions: [],
      hash: '0',
      previousHash: '0',
      nonce: 0,
      timestamp: new Date(),
    };
    service.addBlock(genesisBlock);

    const lastBlock: Block = {
      id: 1,
      transactions: [],
      hash: '1',
      previousHash: '0',
      nonce: 1,
      timestamp: new Date(),
    };
    service.addBlock(lastBlock);

    expect(service.getLastBlock()).toEqual(lastBlock);
  });
});
