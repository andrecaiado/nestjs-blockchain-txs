import { WalletMinerDto } from '../dto/wallet-miner.dto';
import { WalletDto } from '../dto/wallet.dto';
import { Wallet } from '../wallet';

export class WalletMapper {
  static toWalletDto(wallet: Wallet): WalletDto {
    const walletDto = new WalletDto();
    walletDto.name = wallet.name;
    walletDto.publicKey = wallet.publicKey;
    walletDto.type = wallet.type;

    return walletDto;
  }

  static toWalletMinerDto(wallet: Wallet): WalletMinerDto {
    const walletDto = new WalletMinerDto();
    walletDto.name = wallet.name;
    walletDto.type = wallet.type;

    return walletDto;
  }
}
