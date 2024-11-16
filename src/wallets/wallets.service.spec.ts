import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Wallet } from './wallet';

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService],
    }).compile();

    service = module.get<WalletsService>(WalletsService);

    // Clear wallets
    service['wallets'] = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
});
