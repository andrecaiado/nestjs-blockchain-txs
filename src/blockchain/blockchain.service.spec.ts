import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { Block } from 'src/blocks/block';
import { ConfigService } from '@nestjs/config';
import * as blockchainMock from 'src/__mocks__/blockchain.mock.json';
import * as blockchainDtoMock from 'src/__mocks__/blockchain.dto.mock.json';
import { BlockMapper } from 'src/blocks/block.mapper';
import { BlockDtoMapper } from 'src/blocks/dto/mappers/block.dto.mapper';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'blockchain.maxCoinSupply') {
        return 1000000;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configServiceMock = module.get<ConfigService>(ConfigService);

    service['blockchain'].chain = JSON.parse(JSON.stringify(blockchainMock));
  });

  afterEach(async () => {
    jest.clearAllMocks();
    service['blockchain'].chain = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configServiceMock).toBeDefined();
  });

  it('should create a blockchain', () => {
    expect(service['blockchain']).toBeDefined();
  });

  it('should get the UTXOs of a wallet', () => {
    const utxos = service.getWalletUTXOs(
      '020ce717ba67dd192b85480e5c2808e92bb0e8dd22c1adc0f4d6395e3be7be7679',
    );

    const expectedUtxos = [
      {
        amount: 799.998,
        id: '851bdd7372c77ea8c5d4c6ca09fdd5159fd78e3061de57e133ec2bfc9f1c1ae5',
        parentTransactionId:
          '8cec5123342bff55113b6310fa939af015ad383a3054366c1f3cca2143992f0a',
        recipientPublicKey:
          '020ce717ba67dd192b85480e5c2808e92bb0e8dd22c1adc0f4d6395e3be7be7679',
      },
      {
        amount: 50,
        id: 'a562451272f8e6bdbf74edd2d7d6bd045e0594b238a8dd3293dc6bbf9c80efc4',
        parentTransactionId:
          '9ef105ffd6da93b99404a518c331a11c36ca9897acfd25b9673b16c3d058a524',
        recipientPublicKey:
          '020ce717ba67dd192b85480e5c2808e92bb0e8dd22c1adc0f4d6395e3be7be7679',
      },
    ];

    expect(utxos).toEqual(expectedUtxos);
  });

  it('should get UTXOs', () => {
    const utxos = service.getUTXOs();

    const expectedUtxos = [
      {
        amount: 50.001,
        id: '378acf30754513e6160bb3cab1a4a76667de6c16ffaa4dbe9db44ff416901702',
        parentTransactionId: '0',
        recipientPublicKey:
          '03c9762476023390d99b4675bfda24abcdbf82b0bbf9a6099292f95f98a049da5d',
      },
      {
        amount: 50.001,
        id: '01b76489b5a7040976daf3031db928decff873d87ffe4a206eaf075358af1a03',
        parentTransactionId: '0',
        recipientPublicKey:
          '03c9762476023390d99b4675bfda24abcdbf82b0bbf9a6099292f95f98a049da5d',
      },
      {
        amount: 799.998,
        id: '851bdd7372c77ea8c5d4c6ca09fdd5159fd78e3061de57e133ec2bfc9f1c1ae5',
        parentTransactionId:
          '8cec5123342bff55113b6310fa939af015ad383a3054366c1f3cca2143992f0a',
        recipientPublicKey:
          '020ce717ba67dd192b85480e5c2808e92bb0e8dd22c1adc0f4d6395e3be7be7679',
      },
      {
        amount: 50.001,
        id: '04faf481cfa5e60e3dc16c7908e37d97e301a00e79eb4b0c01b3d357007bc239',
        parentTransactionId: '0',
        recipientPublicKey:
          '024d4df1cdd4a872aa60bb1072f4f1a920df591be4afc89ed6f4cf215b660d5517',
      },
      {
        amount: 50,
        id: 'a562451272f8e6bdbf74edd2d7d6bd045e0594b238a8dd3293dc6bbf9c80efc4',
        parentTransactionId:
          '9ef105ffd6da93b99404a518c331a11c36ca9897acfd25b9673b16c3d058a524',
        recipientPublicKey:
          '020ce717ba67dd192b85480e5c2808e92bb0e8dd22c1adc0f4d6395e3be7be7679',
      },
      {
        amount: 149.999,
        id: '10ffd9e4810dd0fec2b30f6f4a000c19fcb7c14e232acc409ed739e0b1931c46',
        parentTransactionId:
          '9ef105ffd6da93b99404a518c331a11c36ca9897acfd25b9673b16c3d058a524',
        recipientPublicKey:
          '03e893009f79daea4ee140ba1bdc7dfd6766b22b54a660739395e099afbcfe29db',
      },
    ];

    expect(utxos).toEqual(expectedUtxos);
  });

  it('should add a block', () => {
    const aBlock: Block = new Block();
    aBlock.id = 1;
    aBlock.transactions = [];
    aBlock.hash = '1';
    aBlock.previousHash = '0';
    aBlock.nonce = 1;
    aBlock.timestamp = new Date().getTime();
    aBlock.data = 'A Block';

    service.addBlock(aBlock);

    expect(service.getLastBlock()).toEqual(aBlock);
  });

  it('should get the last block', () => {
    const aBlock: Block = new Block();
    aBlock.id = 1;
    aBlock.transactions = [];
    aBlock.hash = '1';
    aBlock.previousHash = '0';
    aBlock.nonce = 1;
    aBlock.timestamp = new Date().getTime();
    aBlock.data = 'A Block';

    service.addBlock(aBlock);

    const anotherBlock: Block = new Block();
    anotherBlock.id = 1;
    anotherBlock.transactions = [];
    anotherBlock.hash = '1';
    anotherBlock.previousHash = '0';
    anotherBlock.nonce = 1;
    anotherBlock.timestamp = new Date().getTime();
    anotherBlock.data = 'A Block';

    service.addBlock(anotherBlock);

    expect(service.getLastBlock()).toEqual(anotherBlock);
  });

  it('should return the blockchain dto', () => {
    const blockchainDto = service.getBlockchainDto();

    expect(blockchainDto).toEqual(blockchainDtoMock);
  });

  it('should return the total UTXOs amount', () => {
    const totalUtxos = service.getTotalUTXOs();

    expect(totalUtxos).toEqual(1150);
  });

  it('should return a block', () => {
    const block = service.getBlock('0');

    const expectedBlock = BlockMapper.toBlockDto(
      service['blockchain'].chain[0],
    );

    expect(block).toEqual(expectedBlock);
  });

  it('should discard block if mapping fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error');

    jest.spyOn(BlockDtoMapper, 'toBlock').mockImplementationOnce(() => {
      throw new Error('Mapping error');
    });

    await service.poolAnnouncedBlocksHandler(null);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Blockchain service: Error mapping message to block, block discarded.`,
    );
  });

  it('should discard block if validation fails due to incorrect hash', async () => {
    const consoleSpy = jest.spyOn(console, 'error');

    const newBlock: Block = new Block();
    newBlock.id = 4;
    newBlock.transactions = [];
    newBlock.timestamp = new Date().getTime();
    newBlock.data = 'New block';
    newBlock.previousHash =
      '000068cc92b5bd2b973561ee496b288b6eeec543f3a2b3464ead41dc58b435a5';
    newBlock.nonce = 0;
    newBlock.hash = 'invalid-hash';

    await service.poolAnnouncedBlocksHandler(newBlock);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Blockchain service: Block #${newBlock.id} hash is incorrect, block discarded.`,
    );
  });

  it('should discard block if validation fails due to incorrect previous hash', async () => {
    const consoleSpy = jest.spyOn(console, 'error');

    const newBlock: Block = new Block();
    newBlock.id = 4;
    newBlock.transactions = [];
    newBlock.timestamp = new Date().getTime();
    newBlock.data = 'New block';
    newBlock.previousHash = 'invalid-previous-hash';
    newBlock.nonce = 0;
    newBlock.hash = newBlock.calculateHash();

    await service.poolAnnouncedBlocksHandler(newBlock);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      `Blockchain service: Block #${newBlock.id} previous hash is incorrect, block discarded.`,
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      `Blockchain service: Block #${newBlock.id} is not valid, block discarded.`,
    );
  });

  it('should add block to the blockchain', async () => {
    const consoleSpy = jest.spyOn(console, 'log');

    const newBlock: Block = new Block();
    newBlock.id = 4;
    newBlock.transactions = [];
    newBlock.timestamp = new Date().getTime();
    newBlock.data = 'New block';
    newBlock.previousHash =
      '000068cc92b5bd2b973561ee496b288b6eeec543f3a2b3464ead41dc58b435a5';
    newBlock.nonce = 0;
    newBlock.hash = newBlock.calculateHash();

    await service.poolAnnouncedBlocksHandler(newBlock);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Blockchain service: Block added to the blockchain.',
    );

    const chain: Block[] = service['blockchain'].chain;
    expect(chain[chain.length - 1]).toStrictEqual(newBlock);
  });
});
