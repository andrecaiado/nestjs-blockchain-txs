import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { WalletsService } from 'src/wallets/wallets.service';
import { PoolsService } from 'src/pools/pools.service';
import { Wallet } from 'src/wallets/wallet';
import { TransactionOutput } from './transaction';
import * as createTransactionDtoMock from 'src/__mocks__/create-transaction.dto.mock.json';

describe('TransactionsService', () => {
  const senderWallet = new Wallet('SenderWallet', false);
  const recipientWallet = new Wallet('RecipientWallet', false);
  const coinbaseWallet = new Wallet('CoinbaseWallet', false);

  let service: TransactionsService;
  let blockchainServiceMock: Partial<BlockchainService> = {
    getWalletUTXOs: jest.fn(),
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

  // const transactionDto = {
  //   transactionId:
  //     'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
  //   senderPublicKey:
  //     '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776',
  //   recipientPublicKey:
  //     '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
  //   inputs: [
  //     {
  //       transactionOutputId: '123',
  //       UTXO: {
  //         amount: 100.54,
  //         id: '123',
  //         parentTransactionId: '123',
  //         recipientPublicKey:
  //           '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776',
  //       },
  //     },
  //   ],
  //   outputs: [
  //     {
  //       amount: 50,
  //       id: 'c77eab78f1e25ec1c983bbdaa8b455bb2f270222e176c4a2525f366ad2067236',
  //       parentTransactionId:
  //         'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
  //       recipientPublicKey:
  //         '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
  //     },
  //     {
  //       amount: 50.539,
  //       id: '4b8bfd54f3e560cd64b46fb7bdc8a8d55a47fce016b79186dbd86f6c5d0fb776',
  //       parentTransactionId:
  //         'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
  //       recipientPublicKey:
  //         '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
  //     },
  //   ],
  //   amount: 50,
  //   transactionFees: 0.001,
  //   signature:
  //     '1e0a9d077d1ae5a908be5981e0b94781083d3faf41a209332fa4d7fc0887183b068e198a0df731d8f4572aa0a161f031fa0041b654ab685f6919acfe2f415088',
  // };

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

    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([txo]);

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

  it('should fail to create a transaction due to insufficient balance', () => {
    const txo = new TransactionOutput();
    txo.recipientPublicKey = senderWallet.publicKey;
    txo.amount = 100;
    txo.parentTransactionId = '123';
    txo.id = '1';

    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([txo]);

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
    // utxo.recipientPublicKey =
    //   '020f37c48b932cc049651c61f5256a505179eceac96c29edef15216c0cd6904776';
    // utxo.amount = 10.54;
    // utxo.parentTransactionId = '123';
    utxo.id = '123';

    jest.spyOn(blockchainServiceMock, 'getWalletUTXOs').mockReturnValue([utxo]);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(senderWallet);

    jest
      .spyOn(walletsServiceMock, 'findWalletByPublicKey')
      .mockReturnValueOnce(recipientWallet);

    jest
      .spyOn(poolsServiceMock, 'publish')
      .mockImplementation(async () => new Promise((resolve) => resolve()));

    const result = service.submitTransaction(transactionDto);

    expect(poolsServiceMock.publish).toHaveBeenCalledWith(
      'global-tx-pool-exchange',
      transactionDto,
    );

    expect(result).toEqual({
      message: `Transaction ${transactionDto.transactionId} submitted.`,
    });
  });

  //   it('should submit a transaction', async () => {
  //     jest
  //       .spyOn(walletsServiceMock, 'findWalletByPublicKey')
  //       .mockReturnValue(wallet1);

  //     jest
  //       .spyOn(poolsServiceMock, 'publish')
  //       .mockImplementation(async () => new Promise((resolve) => resolve()));

  //     const result = await service.submitTransaction(transactionDto);

  //     expect(poolsServiceMock.publish).toHaveBeenCalledWith(
  //       'global-tx-pool-exchange',
  //       transactionDto,
  //     );

  //     expect(result).toEqual({
  //       message: `Transaction ${transactionDto.transactionId}: submitted.`,
  //     });
  //   });

  //   it('should throw an error when the signature is invalid', async () => {
  //     const invalidTransactionDto = { ...transactionDto };
  //     invalidTransactionDto.signature =
  //       '5e17063610388d2bc9b8866a15f331ad4119adc3bc703476729fa867e7c9c9b52432f991d76577092d20f16335839343522e8be0c7f8fd7ac553333b04d7b672';

  //     await expect(
  //       service.submitTransaction(invalidTransactionDto),
  //     ).rejects.toThrow(
  //       new BadRequestException(
  //         `Transaction ${invalidTransactionDto.transactionId} validation: signature is invalid`,
  //       ),
  //     );
  //   });

  //   it('should throw an error when the sender wallet is not found', async () => {
  //     jest
  //       .spyOn(walletsServiceMock, 'findWalletByPublicKey')
  //       .mockReturnValue(null);

  //     await expect(() =>
  //       service.submitTransaction(transactionDto),
  //     ).rejects.toThrow(
  //       new BadRequestException(
  //         `Transaction ${transactionDto.transactionId} validation: sender wallet not found`,
  //       ),
  //     );
  //   });

  //   it('should throw an error when the inputs UTXOs are not unspent', async () => {
  //     jest
  //       .spyOn(walletsServiceMock, 'findWalletByPublicKey')
  //       .mockReturnValue(wallet1);

  //     jest.spyOn(blockchainService, 'getWalletUTXOs').mockReturnValue([]);

  //     await expect(() =>
  //       service.submitTransaction(transactionDto),
  //     ).rejects.toThrow(
  //       new BadRequestException(
  //         `Transaction ${transactionDto.transactionId}: there are UTXOs that are not unspent`,
  //       ),
  //     );
  //   });

  //   it('should throw an error when the inputs are not enough to cover the outputs', async () => {
  //     jest
  //       .spyOn(walletsServiceMock, 'findWalletByPublicKey')
  //       .mockReturnValue(wallet1);

  //     jest
  //       .spyOn(blockchainService, 'getWalletUTXOs')
  //       .mockReturnValue([transactionDto.inputs[0].UTXO]);

  //     jest.spyOn(configServiceMock, 'get').mockImplementation((key: string) => {
  //       if (key === 'blockchain.transactionFees') {
  //         return 1000;
  //       }
  //       return null;
  //     });

  //     await expect(() =>
  //       service.submitTransaction(transactionDto),
  //     ).rejects.toThrow(
  //       new BadRequestException(
  //         `Transaction ${transactionDto.transactionId}: inputs are not enough to cover the outputs`,
  //       ),
  //     );
  //   });

  //   it('should create a genesis transaction', () => {
  //     // jest
  //     //   .spyOn(walletsServiceMock, 'getCoinbaseWallet')
  //     //   .mockReturnValue(coinbaseWallet);
  //     //jest.spyOn(walletsServiceMock, 'getRandomWallet').mockReturnValue(wallet1);

  //     const genesisTransaction = service.createGenesisTransaction();
  //     expect(genesisTransaction.senderPublicKey).toBe(coinbaseWallet.publicKey);
  //     expect(genesisTransaction.recipientPublicKey).toBe(wallet1.publicKey);
  //     expect(genesisTransaction.amount).toBe(1000);
  //     expect(genesisTransaction.inputs.length).toBe(0);
  //     expect(genesisTransaction.outputs.length).toBe(1);
  //     expect(genesisTransaction.outputs[0]).toStrictEqual({
  //       recipientPublicKey: wallet1.publicKey,
  //       amount: 1000,
  //       parentTransactionId: '0',
  //       id: '0',
  //     });
  //     expect(genesisTransaction.transactionFees).toBe(0);
  //     expect(genesisTransaction.transactionId).toBe('0');
  //   });

  //   it('should create a coinbase transaction', () => {
  //     const coinbaseTransaction = service.createCoinbaseTransaction(wallet1, 5.5);
  //     expect(coinbaseTransaction.transactionId).toBe('0');
  //     expect(coinbaseTransaction.senderPublicKey).toBe('');
  //     expect(coinbaseTransaction.recipientPublicKey).toBe(wallet1.publicKey);
  //     expect(coinbaseTransaction.amount).toBe(55.5);
  //     expect(coinbaseTransaction.inputs.length).toBe(0);
  //     expect(coinbaseTransaction.outputs.length).toBe(1);
  //     expect(coinbaseTransaction.outputs[0]).toStrictEqual({
  //       recipientPublicKey: wallet1.publicKey,
  //       amount: 55.5,
  //       parentTransactionId: '0',
  //       id: '0',
  //     });
  //     expect(coinbaseTransaction.transactionFees).toBe(0);
  //   });
});
