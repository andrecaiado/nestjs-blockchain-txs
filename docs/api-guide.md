# API guide

This guide will help you to understand:
- What is the purpose of each endpoint.
- Which endpoints to call to execute different use cases.

## Contents
- [Endpoints](#endpoints)
- [Use cases](#use-cases)

# Endpoints

To know which endpoints are available, please refer to the Swagger UI that is available at: [http://localhost:3000/api](http://localhost:3000/api)

# Use cases

This section describes the steps to execute different use cases.

## Submit a transaction

In order to submit a transaction, you need to follow these steps:

| # | What | How |
|-|-|-|
| 1 | Get the sender wallet public key and the recipient wallet public key | 1. Execute the `Get wallets` endpoint, it will return the existing wallets.<br>2. From the response body, choose a wallet that has a balance greater than zero. This will be the sender wallet.<br>3. From the response body, choose another wallet. This will be the recipient wallet.  |
| 2 | Create a new transaction | 1. Open the `Create new transaction` endpoint.<br>2. Add the sender wallet public key in the `publicKey` path parameter.<br>2. Add the recipient public key in the `recipientPublicKey` body attribute.<br>3. Set the amount to send in the `amount` body attribute.<br>4. Execute the request. The response is a well-formed transaction object that will be used in the next step.<br><br>Note: The amount to send + the transaction fees (defined in the `.env` file) must be less or equal than the sender wallet balance. |
| 3 | Submit the transaction | 1. Copy the response from the previous request (it's the transaction).<br>2. Open the `Submit transaction` endpoint.<br>3. Paste the transaction in the `transaction` body attribute.<br>4. Execute the request. |

1. Get the sender wallet public key and the recipient wallet public key
3. Create a new transaction with the sender wallet public key, the recipient wallet public key and the amount 
4. Copy the response from the previous request (it's the transaction)
4. Submit the transaction

## Get wallets balance

| # | What | How |
|-|-|-|
| 1 | Get the wallets | 1. Execute the `Get wallets` endpoint. It will return the existing wallets details, including balance. |

## View the blockchain status and blocks preview

| # | What | How |
|-|-|-|
| 1 | View the blockchain details | 1. Execute the `Get blockchain status and blocks preview` endpoint. It will return the blockchain status and blocks preview. |

## View a block details 

| # | What | How |
|-|-|-|
| 1 | Get the block id | 1. View the blockchain details and choose a block id. |
| 2 | Get the block details | 1. Open the `Get block` endpoint.<br>2. Add the block id in the `blockId` path parameter.<br>3. Execute the request. |


