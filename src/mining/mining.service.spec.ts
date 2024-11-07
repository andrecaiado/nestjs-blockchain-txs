import { Test, TestingModule } from '@nestjs/testing';
import { MiningService } from './mining.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionDtoMapper } from 'src/transactions/dto/mappers/transaction.mapper';
import { BlocksService } from 'src/blocks/blocks.service';
import { Block } from 'src/blocks/block';

describe('MiningService', () => {
  let service: MiningService;
  let transactionsServiceMock: Partial<TransactionsService>;
  let blockchainServiceMock: Partial<BlockchainService>;
  let blocksServiceMock: Partial<BlocksService>;

  const msg = {
    transactionId:
      '658bde861e5a02791b267a762f45aa10736a192edc4808bbe6a4dbfcb018277a',
    amount: 50,
    recipientPublicKey:
      '02b9bc20ccc1ff9bb5c31913ef602249ca301c45410bc81af869b01d33a3a712b1',
    senderPublicKey:
      '02fe07359370462589889e1cfa81d2a52e674caa101f2908e884ee2d9cfeaf531d',
    signature:
      'b94c7290964b37b9301e720b14432cab2d90001b198dd40913621308e011736902f1a0e1b5ecc6b7d098de6ca7ed69714e61f3092f06248b6c1569a1493b1291',
    transactionFees: 0.001,
    inputs: [
      {
        transactionOutputId: '123',
        UTXO: {
          amount: 100.54,
          id: '123',
          parentTransactionId: '123',
          recipientPublicKey:
            '02fe07359370462589889e1cfa81d2a52e674caa101f2908e884ee2d9cfeaf531d',
        },
      },
    ],
    outputs: [
      {
        amount: 50,
        id: '1a05e3d8df0870950d1c33d9f6bc506943bdb2bf9d265510c0d0ab86fa527dd8',
        parentTransactionId:
          '658bde861e5a02791b267a762f45aa10736a192edc4808bbe6a4dbfcb018277a',
        recipientPublicKey:
          '02b9bc20ccc1ff9bb5c31913ef602249ca301c45410bc81af869b01d33a3a712b1',
      },
      {
        amount: 50.539,
        id: '83e28b55576094ff595c34f30fd005817299939206ac6ca9bac2f891cc2d2942',
        parentTransactionId:
          '658bde861e5a02791b267a762f45aa10736a192edc4808bbe6a4dbfcb018277a',
        recipientPublicKey:
          '02b9bc20ccc1ff9bb5c31913ef602249ca301c45410bc81af869b01d33a3a712b1',
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiningService,
        {
          provide: BlockchainService,
          useValue: {
            getWalletUTXOs: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            verifyUTXOsAreUnspent: jest.fn(),
          },
        },
        {
          provide: BlocksService,
          useValue: {
            createBlock: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MiningService>(MiningService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
    transactionsServiceMock =
      module.get<TransactionsService>(TransactionsService);
    blocksServiceMock = module.get<BlocksService>(BlocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(blockchainServiceMock).toBeDefined();
    expect(transactionsServiceMock).toBeDefined();
    expect(blocksServiceMock).toBeDefined();
  });

  it('should log an error if mapping fails', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    jest
      .spyOn(TransactionDtoMapper, 'toTransaction')
      .mockImplementationOnce(() => {
        throw new Error('Mapping error');
      });

    await service.mempoolTxsHandler(msg);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Mining service: Error mapping message to transaction, transaction discarded.',
    );
  });

  it('should handle an empty message gracefully', async () => {
    const emptyMsg = {};
    const block = await service.mempoolTxsHandler(emptyMsg);
    expect(block).toBe(undefined);
  });

  it('should discard transaction if UTXOs are not unspent', async () => {
    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([
      {
        amount: 100.54,
        id: '123',
        parentTransactionId: '123',
        recipientPublicKey:
          '02fe07359370462589889e1cfa81d2a52e674caa101f2908e884ee2d9cfeaf531d',
      },
    ]);
    jest
      .spyOn(transactionsServiceMock, 'verifyUTXOsAreUnspent')
      .mockImplementation(() => false);

    const block = await service.mempoolTxsHandler(msg);
    expect(block).toBe(undefined);
  });

  it('should create a new block', async () => {
    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([
      {
        amount: 100.54,
        id: '123',
        parentTransactionId: '123',
        recipientPublicKey:
          '02fe07359370462589889e1cfa81d2a52e674caa101f2908e884ee2d9cfeaf531d',
      },
    ]);

    jest
      .spyOn(transactionsServiceMock, 'verifyUTXOsAreUnspent')
      .mockImplementation(() => true);

    const expectedBlock: Block = {
      transactions: [],
      hash: 'hash',
      previousHash: '0',
      nonce: 0,
      timestamp: new Date(),
    };
    jest.spyOn(blocksServiceMock, 'createBlock').mockImplementation(() => {
      return expectedBlock;
    });

    await expect(service.mempoolTxsHandler(msg)).resolves.toBe(expectedBlock);
  });
});
