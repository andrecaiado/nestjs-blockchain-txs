import { Test, TestingModule } from '@nestjs/testing';
import { MiningService } from './mining.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { TransactionDtoMapper } from 'src/transactions/dto/mappers/transaction.dto.mapper';
import { BlocksService } from 'src/blocks/blocks.service';
import { Block } from 'src/blocks/block';
import { WalletsService } from 'src/wallets/wallets.service';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'src/wallets/wallet';
import { PoolsService } from 'src/pools/pools.service';
import * as createTransactionDtoMock from 'src/__mocks__/create-transaction.dto.mock.json';

describe('MiningService', () => {
  const minerWallet = new Wallet('SenderWallet', true);
  const recipientWallet = new Wallet('RecipientWallet', false);

  let service: MiningService;
  let blockchainServiceMock: Partial<BlockchainService>;
  let transactionsServiceMock: Partial<TransactionsService>;
  let blocksServiceMock: Partial<BlocksService>;
  let configServiceMock: Partial<ConfigService>;
  let walletsServiceMock: Partial<WalletsService>;
  let poolsServiceMock: Partial<PoolsService>;

  const msg = createTransactionDtoMock;

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
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'blockchain.miningDifficulty') {
                return 1;
              } else if (key === 'rabbitmq.exchanges[1].name') {
                return 'blocks-announcement-pool-exchange';
              }
              return null;
            }),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            getRandomWallet: jest.fn((value: boolean) => {
              if (value) {
                return minerWallet;
              } else {
                return recipientWallet;
              }
            }),
          },
        },
        {
          provide: PoolsService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MiningService>(MiningService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
    transactionsServiceMock =
      module.get<TransactionsService>(TransactionsService);
    blocksServiceMock = module.get<BlocksService>(BlocksService);
    configServiceMock = module.get<ConfigService>(ConfigService);
    walletsServiceMock = module.get<WalletsService>(WalletsService);
    poolsServiceMock = module.get<PoolsService>(PoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(transactionsServiceMock).toBeDefined();
    expect(blocksServiceMock).toBeDefined();
    expect(configServiceMock).toBeDefined();
    expect(walletsServiceMock).toBeDefined();
    expect(poolsServiceMock).toBeDefined();
  });

  it('should log an error if mapping fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error');
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
    const consoleSpy = jest.spyOn(console, 'error');

    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([]);

    jest
      .spyOn(transactionsServiceMock, 'verifyUTXOsAreUnspent')
      .mockImplementation(() => false);

    const block = await service.mempoolTxsHandler(msg);
    expect(block).toBe(undefined);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Mining service: Transaction ${msg.transactionId}: there are UTXOs that are not unspent, transaction discarded.`,
    );
  });

  it('should mine block', async () => {
    jest
      .spyOn(transactionsServiceMock, 'verifyUTXOsAreUnspent')
      .mockImplementation(() => true);

    const expectedBlock: Block = new Block();
    expectedBlock.id = 1;
    expectedBlock.transactions = [];
    expectedBlock.hash = '';
    expectedBlock.previousHash = '0';
    expectedBlock.nonce = 0;
    expectedBlock.timestamp = new Date().getTime();
    expectedBlock.data = '';

    jest.spyOn(blocksServiceMock, 'createBlock').mockImplementation(() => {
      return expectedBlock;
    });

    const minedBlock = await service.mempoolTxsHandler(msg);
    expect(poolsServiceMock.publish).toHaveBeenCalledTimes(1);
    expect(poolsServiceMock.publish).toHaveBeenCalledWith(
      'blocks-announcement-pool-exchange',
      expectedBlock,
    );
    expect(minedBlock.nonce).toBeGreaterThan(0);
    expect(minedBlock.hash).toHaveLength(64);
    expect(minedBlock.hash.startsWith('0')).toBeTruthy;
  });
});
