import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Wallet } from './wallet';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WalletType } from 'src/enums/wallet-type.enum';

describe('WalletsService', () => {
  let service: WalletsService;
  let blockchainServiceMock: Partial<BlockchainService> = {
    getWalletUTXOs: jest.fn().mockReturnValue([
      {
        amount: 50,
        id: 'c77eab78f1e25ec1c983bbdaa8b455bb2f270222e176c4a2525f366ad2067236',
        parentTransactionId:
          'ece5ebdec6341c1d06fe134f9f546e9455d5fe1a813b4f68d5eb42cd3eb0b706',
        recipientPublicKey:
          '0336e019ca786cad806c7542e8d5a652e6209beb933450f24587593728f43a92fd',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: BlockchainService, useValue: blockchainServiceMock },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    blockchainServiceMock = module.get<BlockchainService>(BlockchainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(blockchainServiceMock).toBeDefined();
  });

  it('should have created a coinbase wallet', () => {
    const wallet = service.getCoinbaseWallet();
    expect(wallet).toBeInstanceOf(Wallet);
    expect(wallet.name).toBe('CoinbaseWallet');
    expect(wallet.type).toBe(WalletType.COINBASE);
  });

  it('should have created default wallets', () => {
    const wallets = service.getWallets();
    expect(
      wallets.filter((wallet) => wallet.type === WalletType.REGULAR).length,
    ).toBe(2);
  });

  it('should have created miner wallets', () => {
    const wallet = service.getMinerWallet();
    expect(wallet).toBeInstanceOf(Wallet);
    expect(wallet.name).toBe('WalletMiner');
    expect(wallet.type).toBe(WalletType.MINER);
  });

  it('should create a regular wallet', () => {
    const wallet = service.createWallet({ name: 'WalletTest' });
    expect(wallet).toBeDefined();
    expect(wallet.name).toBe('WalletTest');
    expect(wallet.type).toBe(WalletType.REGULAR);
  });

  it('should throw an error if wallet with same name already exists', () => {
    expect(() => service.createWallet({ name: 'Wallet-1' })).toThrow(
      new ConflictException(`Wallet with name 'Wallet-1' already exists!`),
    );
  });

  it('should get wallets', () => {
    const wallets = service.getWallets();
    expect(wallets).toBeDefined();
    expect(wallets.length).toBe(service['wallets'].length + 1);
  });

  it('should get a wallet', () => {
    const wallet = service['wallets'][0];
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
});
