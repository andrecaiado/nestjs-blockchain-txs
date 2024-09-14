import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];

  constructor() {
    this.createDefaultWallets();
  }

  private createDefaultWallets(): void {
    this.wallets = [];
    console.log('Creating default wallets...');
    this.createWallet({ name: 'Wallet-1' });
    this.createWallet({ name: 'Wallet-2' });
    console.log(`Done. Created ${this.wallets.length} wallets!`);
  }

  public createWallet(createWalletDto: CreateWalletDto): Wallet {
    this.validateWalletCreation(createWalletDto);
    const wallet = new Wallet(createWalletDto.name);
    this.wallets.push(wallet);
    return wallet;
  }

  public getWallets(): Wallet[] {
    return this.wallets;
  }

  public getWallet(publicKey: string): Wallet {
    const wallet = this.wallets.find(
      (wallet) => wallet.getPublicKey() === publicKey,
    );
    if (wallet === null || wallet === undefined) {
      throw new NotFoundException(
        `Wallet with publicKey '${publicKey}' not found!`,
      );
    }
    return wallet;
  }

  private validateWalletCreation(createWalletDto: CreateWalletDto) {
    this.validateWalletName(createWalletDto.name);
  }

  private validateWalletName(name: string) {
    const wallet = this.wallets.find((wallet) => wallet.getName() === name);
    if (wallet !== null && wallet !== undefined) {
      throw new ConflictException(`Wallet with name '${name}' already exists!`);
    }
  }
}
