import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from 'src/blockchain/blockchain.service';

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletsService, BlockchainService, ConfigService],
    }).compile();

    service = module.get<WalletsService>(WalletsService);

    // Clear wallets
    service['wallets'] = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a wallet', () => {
    const wallet = service.createWallet({ name: 'Wallet-1' });
    expect(wallet).toBeDefined();
    expect(wallet.getName()).toBe('Wallet-1');
  });
});
