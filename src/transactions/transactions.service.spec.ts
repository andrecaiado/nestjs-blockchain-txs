import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { WalletsService } from 'src/wallets/wallets.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let blockchainService: BlockchainService;
  let walletsService: WalletsService;

  const transactionDto = {
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        BlockchainService,
        WalletsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              // this is being super extra, in the case that you need multiple keys with the `get` method
              if (key === 'blockchain.transactionFees') {
                return 0.001;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    walletsService = module.get<WalletsService>(WalletsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should submit a transaction', () => {
    const result = service.submitTransaction(transactionDto);

    expect(result).toBe(
      `Transaction ${transactionDto.transactionId}: submitted successfully.`,
    );
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

  it('should throw an error when the sender wallet is not found', () => {
    jest.spyOn(walletsService, 'findWalletByPublicKey').mockReturnValue(null);

    expect(() => service.submitTransaction(transactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${transactionDto.transactionId} validation: sender wallet not found`,
      ),
    );
  });

  it('should throw an error when the inputs UTXOs are not unspent', () => {
    jest.spyOn(blockchainService, 'getWalletUTXOs').mockReturnValue([]);

    expect(() => service.submitTransaction(transactionDto)).toThrow(
      new BadRequestException(
        `Transaction ${transactionDto.transactionId}: there are UTXOs that are not unspent`,
      ),
    );
  });
});
