import * as multisig from "@sqds/multisig";
import {
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  Connection,
  Keypair,
} from "@solana/web3.js";
import { sendTx } from "../send-tx";

/**
 * Creates a vault transaction for a Squads multisig
 */
export async function createVaultTx({
  connection,
  keypair,
  multisigAddress,
  vaultIndex,
  ephemeralSigners = 0,
  instructions,
  memo = "",
}: {
  connection: Connection;
  keypair: Keypair;
  multisigAddress: string;
  vaultIndex: number;
  ephemeralSigners?: number;
  instructions: TransactionInstruction[];
  memo?: string;
}) {
  const multisigPda = new PublicKey(multisigAddress);

  // Fetch multisig account
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  );
  const currentTransactionIndex = Number(multisigAccount.transactionIndex);
  const newTransactionIndex = BigInt(currentTransactionIndex + 1);

  // Derive the vault PDA
  const [vaultPda] = multisig.getVaultPda({
    multisigPda,
    index: vaultIndex,
  });

  // Build TransactionMessage
  const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const txMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash,
    instructions: instructions,
  });

  // Create vault transaction instruction
  const ix = multisig.instructions.vaultTransactionCreate({
    multisigPda,
    transactionIndex: newTransactionIndex,
    creator: keypair.publicKey,
    vaultIndex,
    ephemeralSigners,
    transactionMessage: txMessage,
    memo,
  });

  // Send transaction
  const tx = await sendTx(connection, keypair, [ix]);

  if (!tx || !tx.data) {
    throw new Error("Failed to send vault transaction");
  }

  return {
    multisigAddress: multisigPda.toBase58(),
    transactionIndex: newTransactionIndex.toString(),
    signature: tx.data,
  };
}
