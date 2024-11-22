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
import { WalletType } from 'src/enums/wallet-type.enum';
import { WalletMinerDto } from './dto/wallet-miner.dto';

@Injectable()
export class WalletsService {
  private wallets: Wallet[] = [];
  private coinbaseWallet: Wallet;
  private minerWallet: Wallet;

  constructor(@Inject() private readonly blockchainService: BlockchainService) {
    this.createCoinbaseWallet();
    this.createDefaultWallets();
    this.createMinerWallet();
  }

  private createDefaultWallets(): void {
    console.log('Wallet service: Creating default wallets...');
    this.wallets.push(this.createNewWallet('Wallet-1', WalletType.REGULAR));
    this.wallets.push(this.createNewWallet('Wallet-2', WalletType.REGULAR));
    console.log(
      `Wallet service: Done. Created ${this.wallets.length} default wallets!`,
    );
  }

  private createMinerWallet(): void {
    console.log('Wallet service: Creating the miner wallet...');
    this.minerWallet = this.createNewWallet('WalletMiner', WalletType.MINER);
    console.log(`Wallet service: Done. The miner wallet was created!`);
  }

  private createCoinbaseWallet() {
    console.log('Wallet service: Creating Coinbase wallet...');
    this.coinbaseWallet = this.createNewWallet(
      'CoinbaseWallet',
      WalletType.COINBASE,
    );
    console.log('Wallet service: Done. The Coinbase wallet was created!');
  }

  public getCoinbaseWallet(): Wallet {
    return this.coinbaseWallet;
  }

  public getMinerWallet(): Wallet {
    return this.minerWallet;
  }

  private createNewWallet(name: string, type: WalletType): Wallet {
    const wallet = new Wallet(name, type);
    return wallet;
  }

  public createWallet(createWalletDto: CreateWalletDto): WalletDto {
    this.validateWalletCreation(createWalletDto);
    const wallet = this.createNewWallet(
      createWalletDto.name,
      WalletType.REGULAR,
    );
    this.wallets.push(wallet);

    return WalletMapper.toWalletDto(
      this.findWalletByPublicKey(wallet.publicKey),
    );
  }

  public getWallets(type: WalletType): WalletDto[] | WalletMinerDto[] {
    const wallets: any[] = new Array<any>();

    if (type === WalletType.REGULAR) {
      this.wallets.map((wallet) => {
        const walletDto = WalletMapper.toWalletDto(wallet);
        walletDto.balance = this.getWalletBalance(wallet.publicKey);
        wallets.push(walletDto);
      });
    }

    if (type === WalletType.MINER) {
      const minerWalletDto = WalletMapper.toWalletMinerDto(
        this.getMinerWallet(),
      );
      minerWalletDto.balance = this.getWalletBalance(
        this.getMinerWallet().publicKey,
      );
      wallets.push(minerWalletDto);
    }

    return wallets;
  }

  public getRandomWallet(): Wallet {
    return this.wallets[Math.floor(Math.random() * this.wallets.length)];
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
