import { Test, TestingModule } from '@nestjs/testing';
import { BlocksService } from './blocks.service';
import { ConfigService } from '@nestjs/config';
import { WalletsService } from 'src/wallets/wallets.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Wallet } from 'src/wallets/wallet';
import { Transaction } from 'src/transactions/transaction';
import { Block } from './block';

describe('BlocksService', () => {
  let service: BlocksService;
  let walletsServiceMock: Partial<WalletsService>;
  let blockchainService: BlockchainService;
  let transactionsServiceMock: Partial<TransactionsService>;

  const coinbaseWallet = new Wallet('coinbase');
  const recipientWallet = new Wallet('recipient');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // this is being super extra, in the case that you need multiple keys with the `get` method
              if (key === 'blockchain.genesisBlock.hash') {
                return '123';
              }
              if (key === 'blockchain.genesisBlock.nonce') {
                return 0;
              }
              if (key === 'blockchain.genesisBlock.amount') {
                return 1000;
              }
              return null;
            }),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            getCoinbaseWallet: jest.fn().mockReturnValue(coinbaseWallet),
            getRandomWallet: jest.fn().mockReturnValue(recipientWallet),
          },
        },
        BlockchainService,
        {
          provide: TransactionsService,
          useValue: {
            createCoinbaseTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    walletsServiceMock = module.get<WalletsService>(WalletsService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    transactionsServiceMock =
      module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(walletsServiceMock).toBeDefined();
    expect(blockchainService).toBeDefined();
    expect(transactionsServiceMock).toBeDefined();
  });

  it('should create a genesis block', () => {
    jest
      .spyOn(walletsServiceMock, 'getCoinbaseWallet')
      .mockReturnValue(coinbaseWallet);
    jest
      .spyOn(walletsServiceMock, 'getRandomWallet')
      .mockReturnValue(recipientWallet);

    const genesisBlock = service.createGenesisBlock();
    expect(genesisBlock).toBeDefined();
    expect(genesisBlock.transactions.length).toBe(1);
    expect(genesisBlock.hash).toBe('123');
    expect(genesisBlock.previousHash).toBe('0');
    expect(genesisBlock.nonce).toBe(0);

    const { senderPublicKey, recipientPublicKey, amount } =
      genesisBlock.transactions[0];
    expect(senderPublicKey).toBe(coinbaseWallet.getPublicKey());
    expect(recipientPublicKey).toBe(recipientWallet.getPublicKey());
    expect(amount).toBe(1000);
  });

  it('should create a block', () => {
    const transaction: Transaction = {
      transactionId:
        'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
      senderPublicKey:
        '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776',
      recipientPublicKey:
        '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
      inputs: [
        {
          transactionOutputId: '123',
          UTXO: {
            amount: 100.54,
            id: '123',
            parentTransactionId: '123',
            recipientPublicKey:
              '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776',
          },
        },
      ],
      outputs: [
        {
          amount: 50,
          id: 'c77eab78f1e25ec1c983bbdaa8b455bb2f270222e176c4a2525f366ad2067236',
          parentTransactionId:
            'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
          recipientPublicKey:
            '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
        },
        {
          amount: 50.539,
          id: '4b8bfd54f3e560cd64b46fb7bdc8a8d55a47fce016b79186dbd86f6c5d0fb776',
          parentTransactionId:
            'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
          recipientPublicKey:
            '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
        },
      ],
      amount: 50,
      transactionFees: 0.001,
      signature:
        '1e0a9d077d1ae5a908be5981e0b94781083d3faf41a209332fa4d7fc0887183b068e198a0df731d8f4572aa0a161f031fa0041b654ab685f6919acfe2f415088',
    };

    const latestBlock: Block = {
      transactions: [transaction],
      hash: '123',
      previousHash: '0',
      nonce: 0,
      timestamp: new Date(),
    };

    jest.spyOn(blockchainService, 'getLastBlock').mockReturnValue(latestBlock);
    jest
      .spyOn(transactionsServiceMock, 'createCoinbaseTransaction')
      .mockReturnValue({
        transactionId: '0',
        senderPublicKey: coinbaseWallet.getPublicKey(),
        recipientPublicKey: recipientWallet.getPublicKey(),
        amount: 50,
        signature: '0',
        inputs: [],
        outputs: [
          {
            recipientPublicKey: recipientWallet.getPublicKey(),
            amount: 50,
            parentTransactionId: '0',
            id: '0',
          },
        ],
        transactionFees: 0,
        toString: () => '0',
      });

    const block = service.createBlock([transaction]);
    expect(block).toBeDefined();
    expect(block.previousHash).toBe('123');
    expect(block.transactions.length).toBe(2);
    expect(block.hash).toBe(null);
    expect(block.timestamp).toBeNull();
    expect(block.nonce).toBeNull();
    expect(block.transactions[0].transactionId).toBe('0');
    expect(block.transactions[0].senderPublicKey).toBe(
      coinbaseWallet.getPublicKey(),
    );
    expect(block.transactions[0].recipientPublicKey).toBe(
      recipientWallet.getPublicKey(),
    );
    expect(block.transactions[1].transactionId).toBe(
      'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
    );
    expect(block.transactions[1].senderPublicKey).toBe(
      '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776',
    );
    expect(block.transactions[1].recipientPublicKey).toBe(
      '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
    );
  });
});
