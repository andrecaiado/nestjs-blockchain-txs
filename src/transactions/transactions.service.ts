import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
} from './transaction';
import { TransactionDto } from './dto/transaction.dto';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WalletsService } from 'src/wallets/wallets.service';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from 'src/pools/pools.service';
import { TransactionDtoMapper } from './dto/mappers/transaction.dto.mapper';
import { Wallet } from 'src/wallets/wallet';
import { CreateTransactionDto } from 'src/transactions/dto/create-transaction.dto';
import { TransactionMapper } from './transaction.mapper';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject() private readonly blockchainService: BlockchainService,
    @Inject() private readonly configService: ConfigService,
    @Inject() private readonly walletsService: WalletsService,
    @Inject() private readonly poolsService: PoolsService,
    @Inject() private readonly metricsService: MetricsService,
  ) {}

  public createTransaction(
    senderPublicKey: string,
    createTransactionDto: CreateTransactionDto,
  ): TransactionDto {
    console.log(
      `Transactions service: Creating transaction for wallet ${senderPublicKey}...`,
    );

    const UTXOs = this.getWalletUTXOs(senderPublicKey);
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );

    const { senderWallet, senderWalletBalance } =
      this.validateCreateTransactionRequest(
        senderPublicKey,
        createTransactionDto.recipientPublicKey,
        createTransactionDto.amount,
        UTXOs,
        transactionFees,
      );

    const recipientPublicKey = createTransactionDto.recipientPublicKey;
    let transactionChange =
      senderWalletBalance - (createTransactionDto.amount + transactionFees);
    transactionChange = Number(transactionChange.toFixed(3));

    const transaction = new Transaction();
    transaction.senderPublicKey = senderPublicKey;
    transaction.recipientPublicKey = recipientPublicKey;
    transaction.amount = createTransactionDto.amount;
    transaction.transactionFees = transactionFees;
    transaction.transactionId = transaction.generateTransactionId();
    transaction.inputs = this.createTransactionInputs(UTXOs);
    transaction.outputs = this.createTransactionOutputs(
      recipientPublicKey,
      createTransactionDto.amount,
      transaction.transactionId,
      transactionChange,
      senderPublicKey,
    );
    transaction.signature = transaction.sign(senderWallet.privateKey);

    console.log(
      `Transactions service: Created transaction for wallet ${senderPublicKey}. Transaction ID is '${transaction.transactionId}'`,
    );

    return TransactionMapper.toTransactionDto(transaction);
  }

  private validateCreateTransactionRequest(
    senderPublicKey: string,
    recipientPublicKey: string,
    amount: number,
    UTXOs: TransactionOutput[],
    transactionFees: number,
  ): {
    senderWallet: Wallet;
    senderWalletBalance: number;
  } {
    console.log(`Transactions service: Transaction is being validated...`);

    let errorMsg: string;

    // Verify that the sender wallet exists
    const senderWallet =
      this.walletsService.findWalletByPublicKey(senderPublicKey);
    if (senderWallet === null || senderWallet === undefined) {
      errorMsg = `Sender Wallet with public key '${senderPublicKey}' not found!`;
      console.error(`Transactions service: ${errorMsg}`);
      throw new NotFoundException(errorMsg);
    }

    // Verify that the recipient wallet exists
    const recipientWallet =
      this.walletsService.findWalletByPublicKey(recipientPublicKey);
    if (recipientWallet === null || recipientWallet === undefined) {
      errorMsg = `Recipient Wallet with public key '${recipientPublicKey}' not found!`;
      console.error(`Transactions service: ${errorMsg}`);
      throw new NotFoundException(errorMsg);
    }

    // Verify that the sender and recipient are not the same
    if (senderPublicKey === recipientPublicKey) {
      errorMsg = `Sender and Recipient wallets cannot be the same!`;
      console.error(`Transactions service: ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    // Validate that the sender has enough balance to cover the transaction (amount + transaction fees)
    // Calculate the balance from the UTXOs
    const senderWalletBalance = this.calculateBalanceFromUTXOS(UTXOs);
    if (senderWalletBalance < amount + transactionFees) {
      errorMsg = `Insufficient balance for wallet '${senderPublicKey}'!\n Balance is: ${senderWalletBalance}. Required: ${amount + transactionFees} (amount + transaction fees)`;
      console.error(`Transactions service: ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    console.log(`Transactions service: Transaction is valid.`);

    return { senderWallet, senderWalletBalance };
  }

  private createTransactionInputs(
    UTXOs: TransactionOutput[],
  ): TransactionInput[] {
    return UTXOs.map((UTXO) => {
      const transaction = new TransactionInput();
      transaction.transactionOutputId = UTXO.id;
      transaction.UTXO = UTXO;
      return transaction;
    });
  }

  private createTransactionOutputs(
    recipientPublicKey: string,
    amount: number,
    parentTransactionId: string,
    transactionChange: number,
    senderPublicKey: string,
  ): TransactionOutput[] {
    // Create transaction output for recipient
    const outputs: TransactionOutput[] = [];

    const output = new TransactionOutput();
    output.amount = amount;
    output.parentTransactionId = parentTransactionId;
    output.recipientPublicKey = recipientPublicKey;
    output.id = output.generateTransactionOutputId();
    outputs.push(output);

    // Add change output (if any) to sender
    if (transactionChange > 0) {
      const changeOutput = new TransactionOutput();
      changeOutput.amount = transactionChange;
      changeOutput.parentTransactionId = parentTransactionId;
      changeOutput.recipientPublicKey = senderPublicKey;
      changeOutput.id = changeOutput.generateTransactionOutputId();
      outputs.push(changeOutput);
    }

    return outputs;
  }

  private calculateBalanceFromUTXOS(UTXOs: TransactionOutput[]): number {
    return UTXOs.reduce((acc, UTXO) => acc + UTXO.amount, 0);
  }

  public submitTransaction(transactionDto: TransactionDto) {
    console.log(
      `Transactions service: Transaction ${transactionDto.transactionId} submitting...`,
    );

    this.metricsService.incTotalTxsSubmitted();

    this.validateTransaction(
      TransactionDtoMapper.toTransaction(transactionDto),
    );

    this.poolsService.publish(
      this.configService.get<string>('rabbitmq.exchanges[0].name'),
      transactionDto,
    );

    this.metricsService.incTotalTxsValidated();

    const msg = `Transaction ${transactionDto.transactionId} submitted.`;
    console.log(`Transactions service: ${msg}`);

    return {
      message: msg,
    };
  }

  private validateTransaction(transaction: Transaction) {
    let errorMsg: string;

    // Verify signature
    if (transaction.verifySignature(transaction.senderPublicKey) === false) {
      errorMsg = `Transaction ${transaction.transactionId} validation: signature is invalid`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transactions service: Transaction ${transaction.transactionId} validation: signature is valid`,
    );

    // Validate the wallets
    const senderWallet = this.walletsService.findWalletByPublicKey(
      transaction.senderPublicKey,
    );
    if (senderWallet === null || senderWallet === undefined) {
      errorMsg = `Transaction ${transaction.transactionId} validation: sender wallet not found`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new NotFoundException(errorMsg);
    }
    const recipientWallet = this.walletsService.findWalletByPublicKey(
      transaction.recipientPublicKey,
    );
    if (recipientWallet === null || recipientWallet === undefined) {
      errorMsg = `Transaction ${transaction.transactionId} validation: recipient wallet not found`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new NotFoundException(errorMsg);
    }

    // Get the transaction inputs for subsequent validations
    const txUTXOs = transaction.inputs.map((input) => input.UTXO);

    // Verify if the inputs UTXOs belong to the sender
    if (
      !this.verifyTransactionInputsOwnership(
        txUTXOs,
        transaction.senderPublicKey,
      )
    ) {
      errorMsg = `Transaction ${transaction.transactionId} validation: there are UTXOs in the inputs that do not belong to the sender`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transactions service: Transaction ${transaction.transactionId} validation: inputs UTXOs belong to the sender`,
    );

    // Get UTXOs from the sender's wallet for subsequent validations
    const walletUTXOs = this.getWalletUTXOs(transaction.senderPublicKey);

    // Verify if UTXOs are unspent
    if (!this.verifyUTXOsAreUnspent(txUTXOs, walletUTXOs)) {
      errorMsg = `Transaction ${transaction.transactionId}: there are UTXOs that are not unspent`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transactions service: Transaction ${transaction.transactionId} validation: UTXOs are unspent`,
    );

    // Get the transaction fees
    const transactionFees = this.configService.get<number>(
      'blockchain.transactionFees',
    );

    // Verify if the inputs are enough to cover the outputs
    if (
      !this.validateTransactionOutputsCoverage(transaction, transactionFees)
    ) {
      errorMsg = `Transaction ${transaction.transactionId}: inputs are not enough to cover the outputs`;
      console.error(`Transactions service: ${errorMsg}`);
      this.metricsService.incTotalTxsRejected(errorMsg);
      throw new BadRequestException(errorMsg);
    }
    console.log(
      `Transactions service: Transaction ${transaction.transactionId} validation: inputs are enough to cover the outputs`,
    );

    return;
  }

  private calculateInputsAmount(inputs: TransactionInput[]): number {
    return inputs.reduce((acc, input) => acc + input.UTXO.amount, 0);
  }

  private calculateOutputsAmount(outputs: TransactionOutput[]): number {
    return outputs.reduce((acc, output) => acc + output.amount, 0);
  }

  private validateTransactionOutputsCoverage(
    transaction: Transaction,
    transactionFees: number,
  ): boolean {
    const transactionInputsAmount = this.calculateInputsAmount(
      transaction.inputs,
    );
    const transactionOutputsAmount = this.calculateOutputsAmount(
      transaction.outputs,
    );
    const expectedAmount = transactionOutputsAmount + transactionFees;
    return transactionInputsAmount >= expectedAmount;
  }

  private verifyTransactionInputsOwnership(
    UTXOs: TransactionOutput[],
    publicKey: string,
  ): boolean {
    return UTXOs.every((UTXO) => UTXO.recipientPublicKey === publicKey);
  }

  public verifyUTXOsAreUnspent(
    txUTXOs: TransactionOutput[],
    walletUTXOs: TransactionOutput[],
  ): boolean {
    return txUTXOs.every((txUTXO) =>
      walletUTXOs.some((walletUTXO) => walletUTXO.id === txUTXO.id),
    );
  }

  private getWalletUTXOs(publicKey: string): TransactionOutput[] {
    return this.blockchainService.getWalletUTXOs(publicKey);
  }

  public createGenesisTransaction(): Transaction {
    const amount = this.configService.get<number>(
      'blockchain.genesisTransaction.amount',
    );
    const coinbaseWallet = this.walletsService.getCoinbaseWallet();
    const recipientWallet = this.walletsService.getRandomWallet();

    const transaction = new Transaction();
    transaction.senderPublicKey = coinbaseWallet.publicKey;
    transaction.recipientPublicKey = recipientWallet.publicKey;
    transaction.amount = amount;
    transaction.inputs = [];

    const txo = new TransactionOutput();
    txo.recipientPublicKey = recipientWallet.publicKey;
    txo.amount = amount;
    txo.parentTransactionId = '0';
    txo.id = '0';
    transaction.outputs = [txo];
    transaction.transactionFees = 0;
    transaction.transactionId = '0';
    transaction.signature = transaction.sign(coinbaseWallet.privateKey);

    return transaction;
  }

  public createCoinbaseTransaction(
    minerWallet: Wallet,
    transactionFees: number,
  ): Transaction {
    const minerReward: number = this.calculateMinerReward(transactionFees);

    const txo = new TransactionOutput();
    txo.recipientPublicKey = minerWallet.publicKey;
    txo.amount = minerReward;
    txo.parentTransactionId = '0';
    txo.id = txo.generateTransactionOutputId();

    const transaction = new Transaction();
    transaction.transactionId = '0';
    transaction.senderPublicKey = '';
    transaction.recipientPublicKey = minerWallet.publicKey;
    transaction.amount = minerReward;
    transaction.inputs = [];
    transaction.outputs = [txo];
    transaction.transactionFees = 0;
    transaction.signature = '';

    return transaction;
  }

  private calculateMinerReward(transactionFees: number): number {
    let minerReward: number = this.configService.get<number>(
      'blockchain.minerReward',
    );
    const maxCoinSupply: number = this.configService.get<number>(
      'blockchain.maxCoinSupply',
    );
    const currentCoinSupply: number = this.blockchainService.getTotalUTXOs();

    if (currentCoinSupply + minerReward > maxCoinSupply) {
      minerReward =
        maxCoinSupply - currentCoinSupply < 0
          ? 0
          : maxCoinSupply - currentCoinSupply;
      console.log(
        `Transactions service: Miner reward adjusted to ${minerReward} coin(s).`,
      );
    }

    return minerReward + transactionFees;
  }
}
