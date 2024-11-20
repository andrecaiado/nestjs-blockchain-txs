import { Test, TestingModule } from '@nestjs/testing';
import { BlocksService } from './blocks.service';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Wallet } from 'src/wallets/wallet';
import { Transaction, TransactionOutput } from 'src/transactions/transaction';
import { Block } from './block';

describe('BlocksService', () => {
  let service: BlocksService;
  let blockchainServiceMock: Partial<BlockchainService> = {
    getLastBlock: jest.fn(),
    addGenesisBlock: jest.fn(),
  };
  let transactionsServiceMock: Partial<TransactionsService> = {
    createCoinbaseTransaction: jest.fn(),
    createGenesisTransaction: jest.fn(),
  };
  let configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'blockchain.genesisBlock.hash') {
        return '123';
      } else if (key === 'blockchain.genesisBlock.nonce') {
        return 0;
      } else if (key === 'blockchain.minerReward') {
        return 50;
      } else if (key === 'blockchain.maxCoinSupply') {
        return 1000000;
      } else if (key === 'blockchain.transactionFees') {
        return 0.001;
      }
      return null;
    }),
  };

  const coinbaseWallet = new Wallet('CoinbaseWallet', false);
  const minerWallet = new Wallet('SenderWallet', true);
  const senderWallet = new Wallet('SenderWallet', false);
  const recipientWallet = new Wallet('RecipientWallet', false);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: BlockchainService, useValue: blockchainServiceMock },
        { provide: TransactionsService, useValue: transactionsServiceMock },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
    transactionsServiceMock =
      module.get<TransactionsService>(TransactionsService);
    configServiceMock = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(blockchainServiceMock).toBeDefined();
    expect(transactionsServiceMock).toBeDefined();
  });

  it('should create a genesis block', () => {
    const output: TransactionOutput = new TransactionOutput();
    output.recipientPublicKey = recipientWallet.publicKey;
    output.amount = 1000;
    output.parentTransactionId = '0';
    output.id = '0';

    const transaction: Transaction = new Transaction();
    transaction.senderPublicKey = coinbaseWallet.publicKey;
    transaction.recipientPublicKey = recipientWallet.publicKey;
    transaction.amount = 1000;
    transaction.inputs = [];
    transaction.outputs = [output];
    transaction.transactionFees = 0;
    transaction.transactionId = '0';
    transaction.signature = '123';
    jest
      .spyOn(transactionsServiceMock, 'createGenesisTransaction')
      .mockReturnValueOnce(transaction);

    const genesisBlock = service.createGenesisBlock();
    expect(genesisBlock).toBeDefined();
    expect(genesisBlock.transactions.length).toBe(1);
    expect(genesisBlock.hash).toBe('123');
    expect(genesisBlock.previousHash).toBe('0');
    expect(genesisBlock.nonce).toBe(0);

    const { senderPublicKey, recipientPublicKey, amount } =
      genesisBlock.transactions[0];
    expect(senderPublicKey).toBe(coinbaseWallet.publicKey);
    expect(recipientPublicKey).toBe(recipientWallet.publicKey);
    expect(amount).toBe(1000);
    expect(genesisBlock.transactions[0]).toStrictEqual(transaction);
  });

  it('should create a block', () => {
    const minerReward = configServiceMock.get<number>('blockchain.minerReward');
    const transactionFees = configServiceMock.get<number>(
      'blockchain.transactionFees',
    );
    const expectedMinerReward = minerReward + transactionFees;

    const latestBlock: Block = new Block();
    latestBlock.id = 1;
    latestBlock.transactions = [];
    latestBlock.hash = '123';
    latestBlock.previousHash = '0';
    latestBlock.nonce = 0;
    latestBlock.timestamp = new Date().getTime();
    latestBlock.data = null;
    jest
      .spyOn(blockchainServiceMock, 'getLastBlock')
      .mockReturnValueOnce(latestBlock);

    const outputCbtx: TransactionOutput = new TransactionOutput();
    outputCbtx.recipientPublicKey = minerWallet.publicKey;
    outputCbtx.amount = expectedMinerReward;
    outputCbtx.parentTransactionId = '0';
    outputCbtx.id = 'outputCbtxId';
    const coinbaseTransaction: Transaction = new Transaction();
    coinbaseTransaction.transactionId = 'coinbaseTransactionId';
    coinbaseTransaction.senderPublicKey = '';
    coinbaseTransaction.recipientPublicKey = minerWallet.publicKey;
    coinbaseTransaction.amount = expectedMinerReward;
    coinbaseTransaction.inputs = [];
    coinbaseTransaction.outputs = [outputCbtx];
    coinbaseTransaction.transactionFees = 0;
    coinbaseTransaction.signature = '';
    jest
      .spyOn(transactionsServiceMock, 'createCoinbaseTransaction')
      .mockReturnValueOnce(coinbaseTransaction);

    const transaction: Transaction = new Transaction();
    transaction.transactionId = 'minerWallet';
    transaction.senderPublicKey = senderWallet.publicKey;
    transaction.recipientPublicKey = recipientWallet.publicKey;
    transaction.amount = 50;
    transaction.inputs = [];
    const output: TransactionOutput = new TransactionOutput();
    output.amount = 50;
    output.id = 'outputTxId';
    output.parentTransactionId = transaction.transactionId;
    output.recipientPublicKey = recipientWallet.publicKey;
    transaction.outputs = [output];
    transaction.transactionFees = 0.001;
    transaction.signature = '';

    const block = service.createBlock([transaction], minerWallet);
    expect(block).toBeDefined();
    expect(block.id).toBe(latestBlock.id + 1);
    expect(block.previousHash).toBe('123');
    expect(block.transactions.length).toBe(2);
    expect(block.hash).toBe('');
    expect(block.nonce).toBe(0);
    expect(block.transactions[0].transactionId).toBe('coinbaseTransactionId');
    expect(block.transactions[0].senderPublicKey).toBe('');
    expect(block.transactions[0].recipientPublicKey).toBe(
      minerWallet.publicKey,
    );
    expect(block.transactions[1].transactionId).toBe('minerWallet');
    expect(block.transactions[1].senderPublicKey).toBe(senderWallet.publicKey);
    expect(block.transactions[1].recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
  });
});
