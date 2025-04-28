import {
  Keypair,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";

export async function sendTx(
  connection: Connection,
  keypair: Keypair,
  instructions: TransactionInstruction[],
  otherKeypairs?: Keypair[]
): Promise<{
  success: boolean;
  data: string | undefined;
}> {
  const blockhash = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([keypair, ...(otherKeypairs ?? [])] as Signer[]);

  const timeoutMs = 90000;
  const startTime = Date.now();
  let lastSignature: string | undefined; // Track last successful signature
  while (Date.now() - startTime < timeoutMs) {
    const transactionStartTime = Date.now();
    try {
      lastSignature = await connection.sendTransaction(transaction, {
        maxRetries: 0,
        skipPreflight: false,
      });
      const statuses = await connection.getSignatureStatuses([lastSignature]);
      if (statuses.value[0]) {
        if (!statuses.value[0].err) {
          return {
            success: true,
            data: lastSignature,
          };
        } else {
          throw new Error(
            `Transaction failed: ${statuses.value[0].err.toString()}`
          );
        }
      }
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes("already been processed") &&
        lastSignature
      ) {
        // If transaction already processed, return the last signature
        return {
          success: true,
          data: lastSignature,
        };
      }
      let detailedLogs = "No logs available";
      if (error && typeof error.getLogs === "function") {
        try {
          const logs = await error.getLogs();
          detailedLogs = JSON.stringify(logs, null, 2);
        } catch (logError) {
          detailedLogs = `Failed to get logs: ${logError}`;
        }
      }
      throw new Error(
        `Transaction simulation failed: ${error.message}. Logs: ${detailedLogs}`
      );
    }
    const elapsedTime = Date.now() - transactionStartTime;
    const remainingTime = Math.max(0, 1000 - elapsedTime);
    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }
  }
  throw new Error("Transaction timeout");
}
