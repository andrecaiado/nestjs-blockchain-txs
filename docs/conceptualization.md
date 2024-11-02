# Conceptualization

In this section, there will be a brief explanation of how this conceptualization was implemented.

## Contents
- [Conceptualization vs Real-world](#conceptualization-vs-real-world)
- [Process flow](#process-flow)
- [Concepts](#concepts)
  - [Wallet](#wallet)
  - [Transaction](#transaction)
    - [Inputs and outputs](#inputs-and-outputs)
    - [Transaction validation](#transaction-validation)
  - [Block](#block)
    - [Block mining and Proof of Work (PoW)](#block-mining-and-proof-of-work-pow)
    - [Transaction fees and block mining reward](#transaction-fees-and-block-mining-reward)
  - [Blockchain](#blockchain)
    - [The genesis block](#the-genesis-block)
    - [Blockchain validation](#blockchain-validation)
  - [Transaction pools](#rabbitmq-for-the-transaction-pools)
    - [Global transaction pool](#global-transaction-pool)
    - [Miner mempool](#miner-mempool)
    - [Block anouncement pool](#block-anouncement-pool)
    - [Miner pool for anounced blocks](#miner-pool-for-anounced-blocks)

# Conceptualization vs Real-world

The following are the main characteristics of this conceptualization that differs this project from a real-world blockchain network:

- There is no peer-to-peer network.
- There are no multiple miners competing to mine the block.
- There is only one ledger (blockchain).
- All the actors and services are running in the same process.

# Process flow

For a better understanding of the process flow and the different intervenients, please refer to the following diagram:

![Process flow](process-flow.png)

# Concepts

In the next sub sections, there will be a description of the concepts implemented in this project.

## Wallet

The wallet is basically an object containing a public key and a private key that are generated when the wallet is created.
- The public key is used to identify the wallet and verify signatures.
- The private key is used to sign transactions.

For more information on how the keys are generated, please refer to the [Dependencies](implementation.md#dependencies) section.

The application creates 2 wallets when it starts, but the user can create more wallets.

The application has a wallet service that is responsible for:
- Create wallets.
- Get all wallets.
- Get a wallet by public key (it will also return the wallet balance).
- Create transactions:
  - Check if the sender has enough funds (and other validations).
  - Add the inputs (UTXOs) to the transaction.
  - Add the outputs to the transaction.
  - Sign the transaction.

## Transaction

The transaction holds the information about the funds that are transferred from one wallet to another.

The information is the following:
- `id`: The transaction id is a hash of the transaction data (sender, recipient, amount and the timestamp to prevent duplicate transaction ids).
- `sender public key`: The sender public key is the public key of the wallet that is sending the funds.
- `recipient public key`: The recipient public key is the public key of the wallet that is receiving the funds.
- `amount`: The amount is the funds that are being transferred.
- `transaction fees`: The transaction fees is the amount that is payed for processing the transaction.
- `inputs`: The inputs are the funds that are being transferred. The inputs refer to outputs of previous transactions that the sender has received and that were never spent.
- `outputs`: The outputs are the funds that are being received. The outputs are the funds that are being transferred to another wallet.
- `signature`: The signature is the proof that the transaction was signed by the wallet that owns the funds.

The application has a transaction service is responsible for:
- Validate a transaction before adding it to the global transaction pool. The validation includes:
  - Check if the transaction signature is valid (using the sender public key).
  - Validate the sender and recipients wallets exist.
  - Validate if the inputs belong to the sender.
  - Check if the inputs (UTXOs) are not already spent.
  - Check if inputs are enough to cover the outputs.
- Submit a transaction to the global transaction pool.

### Inputs and outputs

The inputs are funds that belongs to the sender and that will be used to fullfill the transaction. They refer to transactions that the sender has previsously received (`"where the money comes from"`) and that where never spent (that's why they are also known as `UTXOs - Unspent Transaction Outputs`).

Basically, an input have the following attributes:
- A reference to the output
- The transaction output (that became an UTXO because it remained unspent)

For simplicity, we will add all the senders UTXOs as inputs in each transaction so we don't have filter UTXOs based on the amount of funds the sender is sending.

The outputs are the destination of the funds to be transfered (`"where the money os going"`). 

Basically, an output have the following attributes:
- Recipient public key
- Amount of funds

### Transaction validation

The transaction validation is the process of validating if the transaction is valid. A transaction is valid if:
- The sum of the inputs is greater than the sum of the outputs (including fees).
- The signature is valid.
- The inputs (UTXOs) are not already spent.

There will be two validations for the transaction:
- A validation before the miner adds the transaction to its mempool (local transaction pool).
- A validation before the miner mines the block. This second validation is done to check is the inputs (UTXOs) remains unspent.

## Block

A block is basically a collection of transactions. Multiple transactions can be added to a block so that the blockchain is smaller and the mining process is more efficient.

A block will hold the following information:
- One or multiple transactions (including the special `coinbase transaction`).
- The block hash
- The previous block hash
- The nonce
- The creation timestamp

### Block mining and Proof of Work (PoW)

The block mining is the step that occurs after the block is created. In order to mine the block, a Proof of work prolem will need to be solved.

The `PoW` is a problem to solve that will consist in finding a `nonce` (number) that, when added to the block, the hash of the block will have a certain number of leading zeros.

The number os zeros (`difficulty`) will be a constant in the application.

### Transaction fees and block mining reward

The `transaction fees` is an amout that is payed for processing a transaction contained in a block. Thus, the total amount of fees will be the sum of each transaction fees in a block.
In this project, the transaction fees will be a constant in the application.

The block `mining reward` is an amount that is payed to the miner by the `network` for the mining work. In this project, the mining reward will be a constant in the application.

The `coinbase transaction` is a special transaction that will be included (as transaction #0) in a block by the miner when the block is created. This transaction inputs and outputs will be the following:
- Inputs: none
- Outputs: 
  - Recipient: miner address (public key)
  - Amount: sum of the mining reward and the total transaction fees

## Blockchain

The blockchain is the collection of blocks. Each block has a reference to the previous block (except the genesis block).

The blockchain is responsible for:
- Adding a block to the blockchain.
- Validating the blockchain.

A single instance of the blockchain object will be created when the application is started and will set the following constants:
- Mining reward
- Transaction fees
- Amount of coins that can be created (minted)

### The genesis block

The genesis block is the first block in the blockchain and will be created when the blockchain is created.

This block has the following characteristics:
- It has no previous block. 
- It is created without PoW. 
- It is created with a fixed hash.
- Contains a single transaction that will create the first funds in the blockchain.

### Blockchain validation

The blockchain validation is the process of validating if the blockchain is valid. A blockchain is valid if:
- The genesis block is valid.
- Each block is valid.
- Each block has a reference to the previous block.

## Transaction and miner pools

This project will use RabbitMQ to simulate the transaction pools and the miner pools. Different message queues will be used to send and receive messages between the different services.

### Global transaction pool

The global transaction pool is the pool that contains all the transactions that are not yet included in a block. These transactions are waiting to be picked up by a miner.

The global transaction pool is responsible for:
- Receiving a transaction from the wallet.
- Sending the transaction to the miner mempool.

### Miner mempool

The miner mempool is the pool that contains the transactions that are waiting to be mined. The miner will pick up the transactions from the global transaction pool and add them to the miner mempool.

### Block anouncement pool

The block anouncement pool is the pool that contains the blocks that are mined by the miner. The miner will send the block to the block anouncement pool so that the blockchain can be updated.

### Miner pool for anounced blocks

The miner pool for anounced blocks is the pool that belongs to a miner. This pool will receive the anounced blocks from the block anouncement pool. The miner will validate the block and, if the block is valid, the miner will add the block to the blockchain.