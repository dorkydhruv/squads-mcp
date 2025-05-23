/// more of a development tool
/// it is not a production tool

import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { BN } from "bn.js";
import { sendTx } from "../../utils/send-tx";

const fundVault = {
  name: "FUND_SQUADS_VAULT",
  description:
    "To fund a multisig, we fund the multisig's vault. SECURITY: For large amounts, use a hardware wallet and verify the destination address. This is a development tool, not for production treasury management.",
  schema: {
    amountToFund: z
      .number()
      .describe(
        "The amount to fund the vault in SOL. SECURITY: For large amounts (10+ SOL), use a hardware wallet and double-check the address."
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
        "The address of the multisig we are funding. SECURITY: Triple-check this address before funding. Optional if already defined in the config."
      )
      .optional(),
  },
  async run({
    amountToFund,
    vaultIndex,
    multisigAddress,
  }: {
    amountToFund?: number;
    vaultIndex?: number;
    multisigAddress?: string;
  }) {
    try {
      const context = await useMcpContext();
      if (!amountToFund)
        return mcpError("No amount to fund provided. Please provide an amount");
      if (!context || !context.connection || !context.keypair)
        return mcpError(
          "No connection. Please connect to a network. Also make sure you are connected to a wallet"
        );
      if (!multisigAddress && !context.multisigAddress)
        return mcpError(
          "No multisig address provided. Please provide a multisig address"
        );
      if (!multisigAddress)
        multisigAddress = context.multisigAddress?.toBase58();
      const multisigPubkey = new PublicKey(multisigAddress!);
      if (!multisigPubkey)
        return mcpError(
          "Invalid multisig address. Please provide a valid address"
        );
      if (!vaultIndex) vaultIndex = 0;
      const vaultPda = multisig.getVaultPda({
        index: vaultIndex,
        multisigPda: multisigPubkey,
      })[0];

      const ix = SystemProgram.transfer({
        fromPubkey: context.keypair.publicKey,
        toPubkey: vaultPda,
        lamports: new BN(amountToFund).mul(new BN(LAMPORTS_PER_SOL)).toNumber(),
      });
      const tx = await sendTx(context.connection, context.keypair, [ix]);
      if (!tx) return mcpError("Transaction failed");
      return mcpText(
        `Vault funded with ${amountToFund} SOL. Transaction: ${tx.data}`
      );
    } catch (e: any) {
      return mcpError(
        `Error funding vault: ${e?.message}. Please make sure you are connected to a network and a wallet`
      );
    }
  },
};

export default fundVault;
