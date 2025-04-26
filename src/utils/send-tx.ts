import {
  Keypair,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import { ComputeBudgetProgram } from "@solana/web3.js";

const feeTiers = {
  min: 0.01,
  mid: 0.5,
  max: 0.95,
};

/**
 * Get priority fees for the current block
 * @param connection - Solana RPC connection
 * @returns Priority fees statistics and instructions for different fee levels
 */
export async function getComputeBudgetInstructions(
  connection: Connection,
  keypair: Keypair,
  instructions: TransactionInstruction[],
  feeTier: keyof typeof feeTiers
): Promise<{
  blockhash: string;
  computeBudgetLimitInstruction: TransactionInstruction;
  computeBudgetPriorityFeeInstructions: TransactionInstruction;
}> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions: instructions,
  }).compileToV0Message();
  const transaction = new VersionedTransaction(messageV0);
  const simulatedTx = connection.simulateTransaction(transaction);
  const estimatedComputeUnits = (await simulatedTx).value.unitsConsumed;
  const safeComputeUnits = Math.ceil(
    estimatedComputeUnits
      ? Math.max(estimatedComputeUnits + 100000, estimatedComputeUnits * 1.2)
      : 200000
  );
  const computeBudgetLimitInstruction =
    ComputeBudgetProgram.setComputeUnitLimit({
      units: safeComputeUnits,
    });

  let priorityFee: number;
  // Use default implementation for priority fee calculation
  priorityFee = await connection
    .getRecentPrioritizationFees()
    .then(
      (fees) =>
        fees.sort((a, b) => a.prioritizationFee - b.prioritizationFee)[
          Math.floor(fees.length * feeTiers[feeTier])
        ].prioritizationFee
    );

  const computeBudgetPriorityFeeInstructions =
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    });

  return {
    blockhash,
    computeBudgetLimitInstruction,
    computeBudgetPriorityFeeInstructions,
  };
}

/**
 * Send a transaction with priority fees
 * @param agent - SolanaAgentKit instance
 * @param tx - Transaction to send
 * @returns Transaction ID
 */
export async function sendTx(
  connection: Connection,
  keypair: Keypair,
  instructions: TransactionInstruction[],
  otherKeypairs?: Keypair[]
): Promise<{
  success: boolean;
  data: string | undefined;
}> {
  const ixComputeBudget = await getComputeBudgetInstructions(
    connection,
    keypair,
    instructions,
    "mid"
  );
  const allInstructions = [
    ixComputeBudget.computeBudgetLimitInstruction,
    ixComputeBudget.computeBudgetPriorityFeeInstructions,
    ...instructions,
  ];
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: ixComputeBudget.blockhash,
    instructions: allInstructions,
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
