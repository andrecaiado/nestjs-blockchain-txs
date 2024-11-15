import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
// import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TransactionOutput } from 'src/transactions/transaction';
import { Wallet } from './wallet';

describe('WalletsService', () => {
  let service: WalletsService;
  // let configServiceMock: Partial<ConfigService> = {
  //   get: jest.fn((key: string) => {
  //     if (key === 'blockchain.transactionFees') {
  //       return 0.001;
  //     }
  //     return null;
  //   }),
  // };
  let blockchainServiceMock: Partial<BlockchainService> = {
    getWalletUTXOs: jest.fn().mockImplementation((walletPublicKey) => {
      const txo = new TransactionOutput();
      txo.amount = 100;
      txo.id = '123';
      txo.parentTransactionId = '456';
      txo.recipientPublicKey = walletPublicKey;
      return [txo];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
        // {
        //   provide: ConfigService,
        //   useValue: configServiceMock,
        // },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    // configServiceMock = module.get<ConfigService>(ConfigService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);

    // Clear wallets
    service['wallets'] = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    // expect(configServiceMock).toBeDefined();
    expect(blockchainServiceMock).toBeDefined();
  });

  it('should create coinbase wallet', () => {
    service['createCoinbaseWallet']();
    expect(service.getCoinbaseWallet()).toBeInstanceOf(Wallet);
    expect(service.getCoinbaseWallet().name).toBe('CoinbaseWallet');
  });

  it('should create default wallets', () => {
    service['createDefaultWallets']();
    const wallets = service.getWallets(false);
    expect(wallets.length).toBe(2);
  });

  it('should create miner wallets', () => {
    service['createDefaultMinerWallets']();
    const wallets = service.getWallets(true);
    expect(wallets.length).toBe(2);
  });

  it('should create a non-miner wallet', () => {
    const wallet = service.createWallet({ name: 'Wallet-1', isMiner: false });
    expect(wallet).toBeDefined();
    expect(wallet.name).toBe('Wallet-1');
    expect(wallet.isMiner).toBe(false);
  });

  it('should throw an error if wallet with same name already exists', () => {
    service.createWallet({ name: 'Wallet-1', isMiner: false });
    expect(() =>
      service.createWallet({ name: 'Wallet-1', isMiner: false }),
    ).toThrow(
      new ConflictException(`Wallet with name 'Wallet-1' already exists!`),
    );
  });

  it('should get wallets', () => {
    service.createWallet({ name: 'Wallet-1', isMiner: false });
    const wallets = service.getWallets(false);
    expect(wallets).toBeDefined();
    expect(wallets.length).toBe(1);
  });

  it('should get a wallet', () => {
    const wallet = service.createWallet({ name: 'Wallet-1', isMiner: false });
    const walletDto = service.getWallet(wallet.publicKey);
    expect(walletDto).toBeDefined();
    expect(walletDto.publicKey).toBe(wallet.publicKey);
  });

  it('should throw an error when wallet is not found', () => {
    expect(() => service.getWallet('invalid-public-key')).toThrow(
      new NotFoundException(
        `Wallet with public address 'invalid-public-key' not found!`,
      ),
    );
  });

  // it('should create a transaction', () => {
  //   const wallet1 = service.createWallet({ name: 'Wallet-1' });
  //   const wallet2 = service.createWallet({ name: 'Wallet-2' });
  //   const transaction = service.createTransaction(wallet1.publicKey, {
  //     recipientPublicKey: wallet2.publicKey,
  //     amount: 10,
  //   });
  //   const transactionFees = configServiceMock.get<number>(
  //     'blockchain.transactionFees',
  //   );
  //   expect(transaction).toBeDefined();
  //   expect(transaction.senderPublicKey).toBe(wallet1.publicKey);
  //   expect(transaction.recipientPublicKey).toBe(wallet2.publicKey);
  //   expect(transaction.amount).toBe(10);
  //   expect(transaction.transactionFees).toBe(transactionFees);
  //   expect(transaction.inputs.length).toBe(1);
  //   expect(transaction.inputs[0].UTXO.amount).toBe(100);
  //   expect(transaction.outputs.length).toBe(2);
  //   expect(transaction.outputs[0].amount).toBe(10);
  //   expect(transaction.outputs[1].amount).toBe(90 - transactionFees);
  // });

  // it('should throw an error when sender wallet is not found', () => {
  //   expect(() =>
  //     service.createTransaction('invalid-public-key', {
  //       recipientPublicKey: 'recipient-public-key',
  //       amount: 10,
  //     }),
  //   ).toThrow(
  //     new NotFoundException(
  //       `Sender Wallet with public key 'invalid-public-key' not found!`,
  //     ),
  //   );
  // });

  // it('should throw as error when the sender and recipients as ther same', () => {
  //   const wallet1 = service.createWallet({ name: 'Wallet-1' });
  //   expect(() =>
  //     service.createTransaction(wallet1.publicKey, {
  //       recipientPublicKey: wallet1.publicKey,
  //       amount: 10,
  //     }),
  //   ).toThrow(
  //     new BadRequestException(
  //       `Sender and Recipient wallets cannot be the same!`,
  //     ),
  //   );
  // });

  // it('should throw an exception if the sender has not enough balance', () => {
  //   const wallet1 = service.createWallet({ name: 'Wallet-1' });
  //   const wallet2 = service.createWallet({ name: 'Wallet-2' });
  //   const transactionFees = configServiceMock.get<number>(
  //     'blockchain.transactionFees',
  //   );
  //   expect(() =>
  //     service.createTransaction(wallet1.publicKey, {
  //       recipientPublicKey: wallet2.publicKey,
  //       amount: 100,
  //     }),
  //   ).toThrow(
  //     new BadRequestException(
  //       `Insufficient balance for wallet '${wallet1.publicKey}'!\n Balance is: 100. Required: ${100 + transactionFees} (amount + transaction fees)`,
  //     ),
  //   );
  // });
});
