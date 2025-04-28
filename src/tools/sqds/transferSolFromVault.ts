import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { createVaultTx } from "../../utils/sqds/create-vault-tx";

const transferSolFromVault = {
  name: "TRANSFER_SOL_FROM_VAULT",
  description:
    "Transfer SOL from a multisig vault to a specified address. Creates and submits the transaction directly.",
  schema: {
    amountToTransfer: z.number().describe("The amount to transfer in SOL"),
    vaultIndex: z
      .number()
      .int()
      .default(0)
      .describe("The index of the vault (optional, usually use 0)")
      .optional(),
    multisigAddress: z
      .string()
      .describe(
        "The address of the multisig we are funding. Optional, might be already defined in the config"
      )
      .optional(),
    sendToAddress: z.string().describe("The address to send the SOL to"),
    memo: z.string().optional().describe("Optional memo for the transaction"),
    ephemeralSigners: z
      .number()
      .int()
      .min(0)
      .default(0)
      .optional()
      .describe("Number of ephemeral signers required"),
  },
  async run({
    amountToTransfer,
    vaultIndex = 0,
    multisigAddress,
    sendToAddress,
    memo = "",
    ephemeralSigners = 0,
  }: {
    amountToTransfer?: number;
    vaultIndex?: number;
    multisigAddress?: string;
    sendToAddress?: string;
    memo?: string;
    ephemeralSigners?: number;
  }) {
    try {
      if (!amountToTransfer)
        return mcpError(
          "No amount to transfer provided. Please provide an amount"
        );
      if (!sendToAddress)
        return mcpError(
          "No address to send the SOL to provided. Please provide an address"
        );
      const context = await useMcpContext();
      if (!context || !context.connection || !context.keypair)
        return mcpError(
          "No connection. Please connect to a network and wallet"
        );

      if (!multisigAddress && !context.multisigAddress)
        return mcpError(
          "No multisig address provided. Please provide a multisig address"
        );

      const msAddress = multisigAddress || context.multisigAddress?.toBase58();
      const multisigPubkey = new PublicKey(msAddress!);

      const vaultPda = multisig.getVaultPda({
        index: vaultIndex,
        multisigPda: multisigPubkey,
      })[0];

      const sendToAddressPubkey = new PublicKey(sendToAddress);
      const amountInLamports = amountToTransfer * LAMPORTS_PER_SOL;

      // Create the transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: vaultPda,
        toPubkey: sendToAddressPubkey,
        lamports: amountInLamports,
      });

      // Create the vault transaction
      const result = await createVaultTx({
        connection: context.connection,
        keypair: context.keypair,
        multisigAddress: msAddress!,
        vaultIndex,
        ephemeralSigners,
        instructions: [instruction],
        memo,
      });

      return mcpText(
        `Successfully created a vault transaction to transfer ${amountToTransfer} SOL to ${sendToAddress}.\n\n` +
          `Transaction details:\n${JSON.stringify(result, null, 2)}`,
        `Proposal accounts must be created to successfully vote and execute vault transactions, therefore please create a proposal.`
      );
    } catch (e: any) {
      console.error(e);
      return mcpError("Error creating transfer vault transaction", e?.message);
    }
  },
};

export default transferSolFromVault;
