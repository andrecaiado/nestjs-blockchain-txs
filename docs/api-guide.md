# API guide

This guide will help you to understand:
- What is the purpose of each endpoint.
- Which endpoints to call to execute different use cases.

## Contents
- [Endpoints](#endpoints)
- [Use cases](#use-cases)

# Endpoints

The available endpoints are the following:

|#|Name|URL|Purpose|
|-|-|-|-|
| 1 | Create wallet | POST /wallets | Creates a wallet with a name and a key pair|
| 2 | Get wallets | GET /wallets | Returns all the wallets |
| 3 | Get wallet by public key | GET /wallets/{wallet public key} | Returns the wallet and its balance |
| 4 | New transaction | POST /wallets/{wallet public key}/transactions | Creates a transaction to be submitted (only creates a transaction with the proper data, it doesn't submit the transaction) |
| 5 | Submit transaction | POST /transactions | Submits the transaction that was created and returned by the `New transaction` endpoint |

# Use cases

This section describes the steps to execute different use cases.

## Submit a transaction

In order to submit a transaction, you need to follow these steps:

1. Create a wallet for the sender (endpoint #1)
2. Create a wallet for the recipient (endpoint #1)
3. Create a new transaction with the sender wallet public key, the recipient wallet public key and the amount (endpoint #4)
4. Submit the transaction (endpoint #5)
