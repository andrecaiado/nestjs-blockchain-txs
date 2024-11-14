import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from './wallet';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransactionOutput } from 'src/transactions/transaction';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WalletDto } from './dto/wallet.dto';
import { WalletMapper } from './mappers/wallet.mapper';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];
  private coinbaseWallet: Wallet;

  constructor(@Inject() private readonly blockchainService: BlockchainService) {
    this.createCoinbaseWallet();
    this.createDefaultWallets();
    this.createDefaultMinerWallets();
  }

  private createDefaultWallets(): void {
    console.log('Wallet service: Creating first wallets...');
    this.createWallet({ name: 'Wallet-1', isMiner: false });
    this.createWallet({ name: 'Wallet-2', isMiner: false });
    console.log(
      `Wallet service: Done. Created ${this.wallets.filter((w) => !w.isMiner).length} wallets!`,
    );
  }

  private createDefaultMinerWallets(): void {
    console.log('Wallet service: Creating first miner wallets...');
    this.createWallet({ name: 'WalletMiner-1', isMiner: true });
    this.createWallet({ name: 'WalletMiner-2', isMiner: true });
    console.log(
      `Wallet service: Done. Created ${this.wallets.filter((w) => w.isMiner).length} miner wallets!`,
    );
  }

  private createCoinbaseWallet() {
    console.log('Wallet service: Creating Coinbase wallet...');
    this.coinbaseWallet = new Wallet('CoinbaseWallet', false);
    console.log('Wallet service: Done. The Coinbase wallet was created!');
  }

  public getCoinbaseWallet() {
    return this.coinbaseWallet;
  }

  public createWallet(createWalletDto: CreateWalletDto): WalletDto {
    this.validateWalletCreation(createWalletDto);
    const wallet = new Wallet(createWalletDto.name, createWalletDto.isMiner);
    this.wallets.push(wallet);

    const walletDto = WalletMapper.toWalletDto(wallet);
    walletDto.balance = this.getWalletBalance(wallet.publicKey);

    return walletDto;
  }

  public getWallets(isMiner: boolean): WalletDto[] {
    return this.wallets
      .filter((w) => w.isMiner === isMiner)
      .map((wallet) => {
        const walletDto = WalletMapper.toWalletDto(wallet);
        walletDto.balance = this.getWalletBalance(wallet.publicKey);
        return walletDto;
      });
  }

  public getRandomWallet(isMiner: boolean): Wallet {
    const wallets = this.wallets.filter((w) => w.isMiner === isMiner);
    return wallets[Math.floor(Math.random() * wallets.length)];
  }

  public getWallet(publicKey: string): WalletDto {
    const wallet = this.findWalletByPublicKey(publicKey);
    if (wallet === null || wallet === undefined) {
      throw new NotFoundException(
        `Wallet with public address '${publicKey}' not found!`,
      );
    }
    const walletDto = WalletMapper.toWalletDto(wallet);
    walletDto.balance = this.getWalletBalance(wallet.publicKey);

    return walletDto;
  }

  public findWalletByPublicKey(publicKey: string): Wallet {
    return this.wallets.find((wallet) => wallet.publicKey === publicKey);
  }

  private validateWalletCreation(createWalletDto: CreateWalletDto) {
    this.validateWalletName(createWalletDto.name);
  }

  private validateWalletName(name: string) {
    const wallet = this.wallets.find((wallet) => wallet.name === name);
    if (wallet !== null && wallet !== undefined) {
      throw new ConflictException(`Wallet with name '${name}' already exists!`);
    }
  }

  private calculateBalanceFromUTXOS(UTXOs: TransactionOutput[]): number {
    return UTXOs.reduce((acc, UTXO) => acc + UTXO.amount, 0);
  }

  private getWalletBalance(publicKey: string): number {
    const UTXOs = this.blockchainService.getWalletUTXOs(publicKey);
    return this.calculateBalanceFromUTXOS(UTXOs);
  }
}
