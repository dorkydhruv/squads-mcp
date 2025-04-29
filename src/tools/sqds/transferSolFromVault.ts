import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { createVaultTx } from "../../utils/sqds/create-vault-tx";

const transferSolFromVault = {
  name: "TRANSFER_SOL_FROM_VAULT",
  description:
    "Transfer SOL from a multisig vault to a specified address. SECURITY: For large amounts, use a hardware wallet and verify the destination address. Always double-check the recipient address and vault index. Creates and submits the transaction directly.",
  schema: {
    amountToTransfer: z
      .number()
      .describe(
        "The amount to transfer in SOL. SECURITY: For large amounts (10+ SOL), use a hardware wallet and double-check the address."
      ),
    vaultIndex: z
      .number()
      .int()
      .default(0)
      .describe(
        "The index of the vault (optional, usually use 0). SECURITY: Confirm the correct vault index for your use case."
      )
      .optional(),
    multisigAddress: z
      .string()
      .describe(
        "The address of the multisig we are funding. SECURITY: Triple-check this address before transferring. Optional, might be already defined in the config."
      )
      .optional(),
    sendToAddress: z
      .string()
      .describe(
        "The address to send the SOL to. SECURITY: Double-check this address before submitting."
      ),
    memo: z
      .string()
      .optional()
      .describe(
        "Optional memo for the transaction. SECURITY: Do not include sensitive information in memos."
      ),
    ephemeralSigners: z
      .number()
      .int()
      .min(0)
      .default(0)
      .optional()
      .describe(
        "Number of ephemeral signers required. SECURITY: Use only if you understand the implications."
      ),
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
        `Successfully created a vault transaction to transfer ${amountToTransfer} SOL to ${sendToAddress}.\n\nTransaction details:\n${JSON.stringify(
          result,
          null,
          2
        )}`,
        "Next step: Create a proposal for this transaction so it can be approved by the multisig."
      );
    } catch (e: any) {
      console.error(e);
      return mcpError("Error creating transfer vault transaction", e?.message);
    }
  },
};

export default transferSolFromVault;
