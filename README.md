# NestJS Blockchain and Cryptocurrency transactions

A NestJS project that demonstrates (generally) how blockchain works in the context of cryptocurrency transactions.

# Contents
- [Disclaimer](#disclaimer)
- [Conceptualization](#conceptualization)
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
    - [RabbitMQ for the transaction pools](#rabbitmq-for-the-transaction-pools)
      - [Global transaction pool](#global-transaction-pool)
      - [Miner mempool](#miner-mempool)
      - [Block anouncement pool](#block-anouncement-pool)
      - [Miner pool for anounced blocks](#miner-pool-for-anounced-blocks)

# Disclaimer

This project is not intended to be a full implementation of a blockchain network. It is a conceptualization of how blockchain works in the context of cryptocurrency transactions. Thus, most of the concepts are simplified and not compliant with the real-world blockchain networks.

# Conceptualization

 In this section, there will be a brief explanation of how this conceptualization was implemented.

## Conceptualization vs Real-world

The following are the main characteristics of this conceptualization that differs this project from a real-world blockchain network:

- There is no peer-to-peer network.
- There are no multiple miners competing to mine the block.
- There is only one ledger (blockchain).
- All the actors and services are running in the same process.

## Process flow

For a better understanding of the process flow and the different intervenients, please refer to the following diagram:

![Process flow](./docs/process-flow.png)

## Concepts

In the next sub sections, there will be a description of the concepts implemented in this project.

### Wallet

The wallet allows the user to transfer funds to another wallet and to check the balance of the wallet. 

The wallet is responsible for:
- Creating a transaction.
- Signing the transaction.
- Submit the transaction (sending the transaction to the transaction pool).

The wallet has a public key and a private key. The public key is used to identify the wallet and the private key is used to sign the transaction.

### Transaction

A transaction is a transfer of funds from one wallet to another. The main attributes of a transaction are:
- `inputs`: The inputs are the funds that are being transferred. The inputs are the outputs of previous transactions.
- `outputs`: The outputs are the funds that are being received. The outputs are the funds that are being transferred to another wallet.
- `signature`: The signature is the proof that the transaction was signed by the wallet that owns the funds.

#### Inputs and outputs:

The inputs are funds that belongs to the sender and that will be used to fullfill the transaction. They refer to transactions that the sender has previsously received (`"where the money comes from"`) and that where never spent (that's why they are also known as `UTXOs - Unspent Transaction Outputs`).

Basically, an input have the following attributes:
- A reference to the output
- The transaction output (that became an UTXO becouse it reamin unspent)

The outputs are the destination of the funds to be transfered (`where the money os going`). 

Basically, an output have the following attributes:
- Recipient public key
- Amount of funds

#### Transaction validation:

The transaction validation is the process of validating if the transaction is valid. A transaction is valid if:
- The sum of the inputs is greater than the sum of the outputs (including fees).
- The signature is valid.
- The inputs (UTXOs) are not already spent.

There will be two validations for the transaction:
- A validation before the miner adds the transaction to its mempool (local transaction pool).
- A validation before the miner mines the block. This second validation is done to check is the inputs (UTXOs) remains unspent.

### Block

A block is basically a collection of transactions. Multiple transactions are added to a block so that the blockchain is smaller and the mining process is more efficient.

#### Block mining and Proof of Work (PoW)

The block mining is the step that occurs after the block is created. In order to mine the block, a Proof of work prolem will need to be solved.

The PoW is a problem to solve that will consist in finding a nonce (number) that, when added to the block, the hash of the block will have a certain number of leading zeros.

The number os zeros (difficulty) will be a constant in the application.

#### Transaction fees and block mining reward

The transaction fees is an amout that is payed for processing a transaction contained in a block. Thus, the total amount of fees will be the sum of each transaction fees in a block.
In this project, the transaction fee will be a constant in the application.

The block mining reward is an amount that is payed to the miner by the `network` for the mining work. In this project, the mining reward will be a constant in the application.

The `coinbase transaction` is a special transaction that will be included (as transaction #0) in a block by the miner when the block is created. This transaction inputs and outputs will be the following:
- Inputs: none
- Outputs: 
  - Recipient: miner address (public key)
  - Amount: sum of the mining reward and the total transaction fees

### Blockchain

#### The genesis block

#### Blockchain validation

### RabbitMQ for the transaction pools

#### Global transaction pool

#### Miner mempool

#### Block anouncement pool

#### Miner pool for anounced blocks
