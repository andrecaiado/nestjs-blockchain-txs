import { WalletDto } from '../dto/wallet.dto';
import { Wallet } from '../wallet';

export class WalletMapper {
  static toWalletDto(wallet: Wallet): WalletDto {
    const walletDto = new WalletDto();
    walletDto.name = wallet.name;
    walletDto.publicKey = wallet.publicKey;
    walletDto.isMiner = wallet.isMiner;

    return walletDto;
  }
}
