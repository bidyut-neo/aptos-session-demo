/* eslint-disable no-console */

import { AptosClient, AptosAccount, FaucetClient, TokenClient, CoinClient } from "aptos";
import { NODE_URL, FAUCET_URL } from "./constants";

(async () => {
  // Create API and faucet clients.
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

  // Create client for working with the token module.
  const tokenClient = new TokenClient(client);

  // Create a coin client for checking account balances.
  const coinClient = new CoinClient(client);

  // Create accounts.
  const user1 = new AptosAccount();
  const user2 = new AptosAccount();

  // Print out account addresses.
  console.log("---------------------------------------------------------------------------------");
  console.log("=== New addresses created ===");
  console.log(`User 1: ${user1.address()}`);
  console.log(`User 2: ${user2.address()}`);
  console.log("");

  // Fund accounts.
  await faucetClient.fundAccount(user1.address(), 100_000_000);
  await faucetClient.fundAccount(user2.address(), 100_000_000);

  console.log("---------------------------------------------------------------------------------");
  console.log("=== Funding received: Initial Coin Balances ===");
  console.log(`user1: ${await coinClient.checkBalance(user1)}`);
  console.log(`user2: ${await coinClient.checkBalance(user2)}`);
  console.log("");

  /**************************** CREATE COLLECTION AND TOKEN ****************************/
  console.log("---------------------------------------------------------------------------------");
  console.log("=== Creating Collection and Token ===");

  const collectionName = "user1's collection";
  const tokenName = "user1's first token";
  const tokenPropertyVersion = 0;

  const tokenId = {
    token_data_id: {
      creator: user1.address().hex(),
      collection: collectionName,
      name: tokenName,
    },
    property_version: `${tokenPropertyVersion}`,
  };

  /**
   * Create the collection.
   */
  const txnHash1 = await tokenClient.createCollection(
    user1,
    collectionName,
    "user1's simple collection",
    "https://user1.com",
  );
  await client.waitForTransaction(txnHash1, { checkSuccess: true });
  console.log("Created collection: Transaction hash: ", txnHash1);

  /**
   * Create a token in that collection.
   */
  const txnHash2 = await tokenClient.createToken(
    user1,
    collectionName,
    tokenName,
    "user1's simple token",
    1,
    "https://aptos.dev/img/nyan.jpeg",
  );
  await client.waitForTransaction(txnHash2, { checkSuccess: true });
  console.log("Created token: Transaction hash: ", txnHash2);
  console.log("");

  // Print the collection data.
  const collectionData = await tokenClient.getCollectionData(user1.address(), collectionName);
  delete collectionData.__headers;
  console.log("---------------------------------------------------------------------------------");
  console.log(`user1's collection: ${JSON.stringify(collectionData, null, 4)}`);

  // Get the token balance.
  const user1Balance1 = await tokenClient.getToken(
    user1.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  console.log(`user1's token balance: ${user1Balance1["amount"]}`);

  // Get the token data.
  const tokenData = await tokenClient.getTokenData(user1.address(), collectionName, tokenName);
  console.log(`user1's token data: ${JSON.stringify(tokenData, null, 4)}`);

  /**************************** TWO STEP TRANSFER ****************************/

  /**
   * Transfer using offer - claim method
   */
  console.log("---------------------------------------------------------------------------------");
  console.log("\n=== Transferring the token from user1 ----> to user2");
  const txnHash3 = await tokenClient.offerToken(
    user1,
    user2.address(),
    user1.address(),
    collectionName,
    tokenName,
    1,
    tokenPropertyVersion,
  );
  await client.waitForTransaction(txnHash3, { checkSuccess: true });
  console.log("Offered: Transaction hash: ", txnHash3);

  // user2 claims the token user1 offered him.
  const txnHash4 = await tokenClient.claimToken(
    user2,
    user1.address(),
    user1.address(),
    collectionName,
    tokenName,
    tokenPropertyVersion,
  );
  await client.waitForTransaction(txnHash4, { checkSuccess: true });
  console.log("Claimed: Transaction hash: ", txnHash4);

  // Print their balances.
  const user1Balance2 = await tokenClient.getToken(
    user1.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  const user2Balance2 = await tokenClient.getTokenForAccount(user2.address(), tokenId);
  console.log("");
  console.log(`user1's token balance: ${user1Balance2["amount"]}`);
  console.log(`user2's token balance: ${user2Balance2["amount"]}`);

  /**************************** ONE STEP DIRECT TRANSFER ****************************/

  /**
   * Multi-agent transfer
   */
  console.log("---------------------------------------------------------------------------------");
  console.log("\n=== Transferring the token back to user1 <--- from user2 using MultiAgent");
  let txnHash5 = await tokenClient.directTransferToken(
    user2,
    user1,
    user1.address(),
    collectionName,
    tokenName,
    1,
    tokenPropertyVersion,
  );
  await client.waitForTransaction(txnHash5, { checkSuccess: true });
  console.log("Direct Transferred: Transaction hash: ", txnHash5);

  // Print out their balances one last time.
  const user1Balance3 = await tokenClient.getToken(
    user1.address(),
    collectionName,
    tokenName,
    `${tokenPropertyVersion}`,
  );
  const user2Balance3 = await tokenClient.getTokenForAccount(user2.address(), tokenId);
  console.log("");
  console.log(`user1's token balance: ${user1Balance3["amount"]}`);
  console.log(`user2's token balance: ${user2Balance3["amount"]}`);
  console.log("");

  /**
   * Final Coin balances of user1 and user2
   */
  console.log("=== Final Coin Balances ===");
  console.log(`user1: ${await coinClient.checkBalance(user1)}`);
  console.log(`user2: ${await coinClient.checkBalance(user2)}`);
  console.log("");

})();
