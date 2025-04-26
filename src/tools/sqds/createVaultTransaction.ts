import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionInstruction,
} from "@solana/web3.js";

const instructionSchema = z.object({
  programId: z.string(),
  keys: z.array(
    z.object({
      pubkey: z.string(),
      isSigner: z.boolean(),
      isWritable: z.boolean(),
    })
  ),
  data: z.string(),
});

const createVaultTransaction = {
  name: "createVaultTransaction",
  description:
    "Create a vault transaction for a Squads multisig. Accepts a list of instructions, vault index, and ephemeral signers.",
  schema: {
    multisigAddress: z.string().describe("The Squads multisig address to use."),
    vaultIndex: z
      .number()
      .int()
      .min(0)
      .describe("Vault index to execute from."),
    ephemeralSigners: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of ephemeral signers required."),
    instructions: z
      .array(instructionSchema)
      .min(1)
      .describe("List of instructions to execute."),
    memo: z.string().optional().describe("Optional memo for the transaction."),
  },
  async run(args: {
    multisigAddress: string;
    vaultIndex: number;
    ephemeralSigners?: number;
    instructions: Array<{
      programId: string;
      keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
      data: string;
    }>;
    memo?: string;
  }) {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.keypair) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, keypair } = context;
      const multisigPda = new PublicKey(args.multisigAddress);
      // Fetch multisig account
      const multisigAccount =
        await multisig.accounts.Multisig.fromAccountAddress(
          connection,
          multisigPda
        );
      const currentTransactionIndex = Number(multisigAccount.transactionIndex);
      const newTransactionIndex = BigInt(currentTransactionIndex + 1);
      // Derive the vault PDA
      const [vaultPda] = multisig.getVaultPda({
        multisigPda,
        index: args.vaultIndex,
      });
      // Build TransactionInstructions from input
      const builtInstructions = args.instructions.map(
        (ix) =>
          new TransactionInstruction({
            programId: new PublicKey(ix.programId),
            keys: ix.keys.map((k) => ({
              pubkey: new PublicKey(k.pubkey),
              isSigner: k.isSigner,
              isWritable: k.isWritable,
            })),
            data: Buffer.from(
              ix.data,
              ix.data.startsWith("0x") ? "hex" : "base64"
            ),
          })
      );
      // Build TransactionMessage
      const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const txMessage = new TransactionMessage({
        payerKey: vaultPda,
        recentBlockhash,
        instructions: builtInstructions,
      });
      // Create vault transaction instruction
      const ix = multisig.instructions.vaultTransactionCreate({
        multisigPda,
        transactionIndex: newTransactionIndex,
        creator: keypair.publicKey,
        vaultIndex: args.vaultIndex,
        ephemeralSigners: args.ephemeralSigners ?? 0,
        transactionMessage: txMessage,
        memo: args.memo || "",
      });
      // Send transaction
      const { sendTx } = await import("../../utils/send-tx");
      const tx = await sendTx(connection, keypair, [ix]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send vault transaction");
      }
      return mcpText(
        JSON.stringify(
          {
            multisigAddress: multisigPda.toBase58(),
            transactionIndex: newTransactionIndex.toString(),
            signature: tx.data,
          },
          null,
          2
        )
      );
    } catch (e: any) {
      return mcpError("Failed to create vault transaction", e?.message);
    }
  },
};

export default createVaultTransaction;
