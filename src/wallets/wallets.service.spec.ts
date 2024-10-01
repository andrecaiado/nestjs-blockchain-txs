import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TransactionOutput } from 'src/transactions/transaction';

describe('WalletsService', () => {
  let service: WalletsService;
  let configService: ConfigService;
  let blockchainServiceMock: Partial<BlockchainService>;

  beforeEach(async () => {
    blockchainServiceMock = {
      getWalletUTXOs: jest.fn().mockImplementation((walletPublicKey) => {
        const txo = new TransactionOutput();
        txo.amount = 100;
        txo.id = '123';
        txo.parentTransactionId = '456';
        txo.recipientPublicKey = walletPublicKey;
        return [txo];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: BlockchainService,
          useValue: blockchainServiceMock,
        },
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

    service = module.get<WalletsService>(WalletsService);
    configService = module.get<ConfigService>(ConfigService);

    // Clear wallets
    service['wallets'] = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create default wallets', () => {
    service['createDefaultWallets']();
    expect(service.getWallets().length).toBe(2);
  });

  it('should create a wallet', () => {
    const wallet = service.createWallet({ name: 'Wallet-1' });
    expect(wallet).toBeDefined();
    expect(wallet.getName()).toBe('Wallet-1');
    expect(service.getWallets().length).toBe(1);
  });

  it('should throw an error if wallet with same name already exists', () => {
    service.createWallet({ name: 'Wallet-1' });
    expect(() => service.createWallet({ name: 'Wallet-1' })).toThrow(
      new ConflictException(`Wallet with name 'Wallet-1' already exists!`),
    );
  });

  it('should get wallets', () => {
    service.createWallet({ name: 'Wallet-1' });
    const wallets = service.getWallets();
    expect(wallets).toBeDefined();
    expect(wallets.length).toBe(1);
  });

  it('should get a wallet', () => {
    const wallet = service.createWallet({ name: 'Wallet-1' });
    const walletDto = service.getWallet(wallet.getPublicKey());
    expect(walletDto).toBeDefined();
    expect(walletDto.publicKey).toBe(wallet.getPublicKey());
  });

  it('should throw an error when wallet is not found', () => {
    expect(() => service.getWallet('invalid-public-key')).toThrow(
      new NotFoundException(
        `Wallet with public address 'invalid-public-key' not found!`,
      ),
    );
  });

  it('should create a transaction', () => {
    const wallet1 = service.createWallet({ name: 'Wallet-1' });
    const wallet2 = service.createWallet({ name: 'Wallet-2' });
    const transaction = service.createTransaction(wallet1.getPublicKey(), {
      recipientPublicKey: wallet2.getPublicKey(),
      amount: 10,
    });
    const transactionFees = configService.get<number>(
      'blockchain.transactionFees',
    );
    expect(transaction).toBeDefined();
    expect(transaction.senderPublicKey).toBe(wallet1.getPublicKey());
    expect(transaction.recipientPublicKey).toBe(wallet2.getPublicKey());
    expect(transaction.amount).toBe(10);
    expect(transaction.transactionFees).toBe(transactionFees);
    expect(transaction.inputs.length).toBe(1);
    expect(transaction.inputs[0].UTXO.amount).toBe(100);
    expect(transaction.outputs.length).toBe(2);
    expect(transaction.outputs[0].amount).toBe(10);
    expect(transaction.outputs[1].amount).toBe(90 - transactionFees);
  });
});
