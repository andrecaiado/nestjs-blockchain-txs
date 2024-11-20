import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletsService } from 'src/wallets/wallets.service';
import { PoolsService } from 'src/pools/pools.service';
import { Wallet } from 'src/wallets/wallet';
import { TransactionOutput } from './transaction';
import * as createTransactionDtoMock from 'src/__mocks__/create-transaction.dto.mock.json';
import { TransactionDtoMapper } from './dto/mappers/transaction.dto.mapper';

describe('TransactionsService', () => {
  const senderWallet = new Wallet('SenderWallet', false);
  const recipientWallet = new Wallet('RecipientWallet', false);
  const coinbaseWallet = new Wallet('CoinbaseWallet', false);

  let service: TransactionsService;
  let blockchainServiceMock: Partial<BlockchainService> = {
    getWalletUTXOs: jest.fn(),
    getTotalUTXOs: jest.fn(),
  };
  let configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'blockchain.transactionFees') {
        return 0.001;
      }
      if (key === 'rabbitmq.exchanges[0].name') {
        return 'global-tx-pool-exchange';
      }
      if (key === 'blockchain.genesisTransaction.amount') {
        return 1000;
      }
      if (key === 'blockchain.minerReward') {
        return 50;
      }
      if (key === 'blockchain.maxCoinSupply') {
        return 1000000;
      }
      return null;
    }),
  };
  let walletsServiceMock: Partial<WalletsService> = {
    getCoinbaseWallet: jest.fn().mockReturnValue(coinbaseWallet),
    getRandomWallet: jest.fn().mockReturnValue(senderWallet),
    findWalletByPublicKey: jest.fn(),
  };
  let poolsServiceMock: Partial<PoolsService> = {
    publish: jest.fn(),
  };

  const transactionDto = createTransactionDtoMock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PoolsService, useValue: poolsServiceMock },
        { provide: BlockchainService, useValue: blockchainServiceMock },
        { provide: WalletsService, useValue: walletsServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
    walletsServiceMock = module.get<WalletsService>(WalletsService);
    configServiceMock = module.get<ConfigService>(ConfigService);
    poolsServiceMock = module.get<PoolsService>(PoolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(walletsServiceMock).toBeDefined();
    expect(configServiceMock).toBeDefined();
    expect(poolsServiceMock).toBeDefined();
    expect(blockchainServiceMock).toBeDefined();
  });

  it('should create a transaction', () => {
    const txo = new TransactionOutput();
    txo.recipientPublicKey = recipientWallet.publicKey;
    txo.amount = 100;
    txo.parentTransactionId = '123';
    txo.id = '1';

    jest
      .spyOn(blockchainServiceMock, 'getWalletUTXOs')
      .mockReturnValueOnce([txo]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    const transactionFees = configServiceMock.get<number>(
      'blockchain.transactionFees',
    );

    const transaction = service.createTransaction(senderWallet.publicKey, {
      recipientPublicKey: recipientWallet.publicKey,
      amount: 10,
    });
    expect(transaction).toBeDefined();
    expect(transaction.senderPublicKey).toBe(senderWallet.publicKey);
    expect(transaction.recipientPublicKey).toBe(recipientWallet.publicKey);
    expect(transaction.amount).toBe(10);
    expect(transaction.transactionFees).toBe(transactionFees);
    expect(transaction.inputs.length).toBe(1);
    expect(transaction.inputs[0].UTXO.amount).toBe(100);
    expect(transaction.outputs.length).toBe(2);
    expect(transaction.outputs[0].amount).toBe(10);
    expect(transaction.outputs[1].amount).toBe(90 - transactionFees);
  });

  it('should throw an error when sender wallet is not found', () => {
    expect(() =>
      service.createTransaction('invalid-public-key', {
        recipientPublicKey: 'recipient-public-key',
        amount: 10,
      }),
    ).toThrow(
      new NotFoundException(
        `Sender Wallet with public key 'invalid-public-key' not found!`,
      ),
    );
  });

  it('should throw as error when the sender and recipients as ther same', () => {
    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValue(senderWallet);

    expect(() =>
      service.createTransaction(senderWallet.publicKey, {
        recipientPublicKey: senderWallet.publicKey,
        amount: 10,
      }),
    ).toThrow(
      new BadRequestException(
        `Sender and Recipient wallets cannot be the same!`,
      ),
    );
  });

  it('should fail to create a transaction due to insufficient balance', () => {
    const txo = new TransactionOutput();
    txo.recipientPublicKey = senderWallet.publicKey;
    txo.amount = 100;
    txo.parentTransactionId = '123';
    txo.id = '1';

    jest
      .spyOn(blockchainServiceMock, 'getWalletUTXOs')
      .mockReturnValueOnce([txo]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    const transactionFees = configServiceMock.get<number>(
      'blockchain.transactionFees',
    );

    expect(() =>
      service.createTransaction(senderWallet.publicKey, {
        recipientPublicKey: recipientWallet.publicKey,
        amount: 100,
      }),
    ).toThrow(
      new BadRequestException(
        `Insufficient balance for wallet '${senderWallet.publicKey}'!\n Balance is: 100. Required: ${100 + transactionFees} (amount + transaction fees)`,
      ),
    );
  });

  it('should submit a transaction', () => {
    const utxo = new TransactionOutput();
    utxo.id = '123';

    jest
      .spyOn(blockchainServiceMock, 'getWalletUTXOs')
      .mockReturnValueOnce([utxo]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    jest
      .spyOn(poolsServiceMock, 'publish')
      .mockImplementationOnce(async () => new Promise((resolve) => resolve()));

    const result = service.submitTransaction(transactionDto);

    expect(poolsServiceMock.publish).toHaveBeenCalledWith(
      'global-tx-pool-exchange',
      transactionDto,
    );

    expect(result).toEqual({
      message: `Transaction ${transactionDto.transactionId} submitted.`,
    });
  });

  it('should throw an error when the signature is invalid', () => {
    const invalidTransactionDto = { ...transactionDto };
    invalidTransactionDto.signature =
      '5e17063610388d2bc9b8866a15f331ad4119adc3bc703476729fa867e7c9c9b52432f991d76577092d20f16335839343522e8be0c7f8fd7ac553333b04d7b672';

    expect(() => service.submitTransaction(invalidTransactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${invalidTransactionDto.transactionId} validation: signature is invalid`,
      ),
    );
  });

  it('should throw an error when the sender wallet is not found', async () => {
    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(null);

    expect(() => service.submitTransaction(transactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${transactionDto.transactionId} validation: sender wallet not found`,
      ),
    );
  });

  it('should throw an error when the inputs UTXOs are not unspent', async () => {
    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValueOnce([]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    expect(() => service.submitTransaction(transactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${transactionDto.transactionId}: there are UTXOs that are not unspent`,
      ),
    );
  });

  it('should throw an error when the inputs are not enough to cover the outputs', async () => {
    const utxo = new TransactionOutput();
    utxo.recipientPublicKey =
      '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776';
    utxo.amount = 10.54;
    utxo.parentTransactionId = '123';
    utxo.id = '123';

    jest
      .spyOn(blockchainServiceMock, 'getWalletUTXOs')
      .mockReturnValueOnce([utxo]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    jest
      .spyOn(configServiceMock, 'get')
      .mockImplementationOnce((key: string) => {
        if (key === 'blockchain.transactionFees') {
          return 1000;
        }
        return null;
      });

    expect(() => service.submitTransaction(transactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${transactionDto.transactionId}: inputs are not enough to cover the outputs`,
      ),
    );
  });

  it('should verify that UTXOs are unspent', () => {
    const txUTXOs = TransactionDtoMapper.toTransaction(transactionDto).outputs;
    const walletUTXOs =
      TransactionDtoMapper.toTransaction(transactionDto).outputs;

    expect(service.verifyUTXOsAreUnspent(txUTXOs, walletUTXOs)).toEqual(true);
  });

  it('should verify that UTXOs are not unspent', () => {
    const txUTXOs = TransactionDtoMapper.toTransaction(transactionDto).outputs;
    const walletUTXOs = [];

    expect(service.verifyUTXOsAreUnspent(txUTXOs, walletUTXOs)).toEqual(false);
  });

  it('should create the genesis transaction', () => {
    const amount = configServiceMock.get<number>(
      'blockchain.genesisTransaction.amount',
    );

    jest
      .spyOn(walletsServiceMock, 'getCoinbaseWallet')
      .mockReturnValueOnce(coinbaseWallet);

    jest
      .spyOn(walletsServiceMock, 'getRandomWallet')
      .mockReturnValueOnce(recipientWallet);

    const genesisTransaction = service.createGenesisTransaction();
    expect(genesisTransaction.senderPublicKey).toBe(coinbaseWallet.publicKey);
    expect(genesisTransaction.recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(genesisTransaction.amount).toBe(amount);
    expect(genesisTransaction.inputs.length).toBe(0);
    expect(genesisTransaction.outputs.length).toBe(1);
    expect(genesisTransaction.outputs[0].recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(genesisTransaction.outputs[0].amount).toBe(amount);
    expect(genesisTransaction.outputs[0].parentTransactionId).toBe('0');
    expect(genesisTransaction.transactionFees).toBe(0);
    expect(genesisTransaction.transactionId).toBe('0');
  });

  it('should create a coinbase transaction', () => {
    const transactionFees = configServiceMock.get<number>(
      'blockchain.transactionFees',
    );
    const minerReward = configServiceMock.get<number>('blockchain.minerReward');
    const amount = transactionFees + minerReward;

    jest.spyOn(blockchainServiceMock, 'getTotalUTXOs').mockReturnValueOnce(100);

    const coinbaseTransaction = service.createCoinbaseTransaction(
      recipientWallet,
      transactionFees,
    );

    expect(coinbaseTransaction.transactionId).toBe('0');
    expect(coinbaseTransaction.senderPublicKey).toBe('');
    expect(coinbaseTransaction.recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(coinbaseTransaction.amount).toBe(amount);
    expect(coinbaseTransaction.inputs.length).toBe(0);
    expect(coinbaseTransaction.outputs.length).toBe(1);
    expect(coinbaseTransaction.outputs[0].recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(coinbaseTransaction.outputs[0].amount).toBe(amount);
    expect(coinbaseTransaction.outputs[0].parentTransactionId).toBe('0');
    expect(coinbaseTransaction.transactionFees).toBe(0);
  });

  it('should create a coinbase transaction, but adjust the miner reward', () => {
    const transactionFees = configServiceMock.get<number>(
      'blockchain.transactionFees',
    );
    const amount = transactionFees + 1;

    jest
      .spyOn(blockchainServiceMock, 'getTotalUTXOs')
      .mockReturnValueOnce(999999);

    const coinbaseTransaction = service.createCoinbaseTransaction(
      recipientWallet,
      transactionFees,
    );

    expect(coinbaseTransaction.transactionId).toBe('0');
    expect(coinbaseTransaction.senderPublicKey).toBe('');
    expect(coinbaseTransaction.recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(coinbaseTransaction.amount).toBe(amount);
    expect(coinbaseTransaction.inputs.length).toBe(0);
    expect(coinbaseTransaction.outputs.length).toBe(1);
    expect(coinbaseTransaction.outputs[0].recipientPublicKey).toBe(
      recipientWallet.publicKey,
    );
    expect(coinbaseTransaction.outputs[0].amount).toBe(amount);
    expect(coinbaseTransaction.outputs[0].parentTransactionId).toBe('0');
    expect(coinbaseTransaction.transactionFees).toBe(0);
  });
});
