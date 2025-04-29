import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const getAssetsTool = {
  name: "GET_ASSETS",
  description:
    "Fetch SOL and token balances for a Squads multisig vault. Expects vaultIndex and multisigAddress.",
  schema: {
    vaultIndex: z
      .number()
      .int()
      .default(0)
      .describe("The index of the vault (usually 0)."),
    multisigAddress: z
      .string()
      .min(1)
      .describe("The address of the multisig whose vault assets to fetch."),
  },
  async run({ vaultIndex = 0, multisigAddress }: { vaultIndex?: number; multisigAddress: string }) {
    try {
      const context = await useMcpContext();
      if (!context || !context.connection)
        return mcpError("No connection. Please connect to a network.");
      if (!multisigAddress)
        return mcpError("No multisig address provided. Please provide a multisig address.");
      const multisigPubkey = new PublicKey(multisigAddress);
      const vaultPda = multisig.getVaultPda({ index: vaultIndex, multisigPda: multisigPubkey })[0];
      // Fetch SOL balance
      const solBalance = await context.connection.getBalance(vaultPda);
      // Fetch SPL token accounts (classic and 2022)
      const [classicTokens, t22Tokens] = await Promise.all([
        context.connection.getParsedTokenAccountsByOwner(vaultPda, { programId: TOKEN_PROGRAM_ID }),
        context.connection.getParsedTokenAccountsByOwner(vaultPda, { programId: TOKEN_2022_PROGRAM_ID }),
      ]);
      const allTokens = [...classicTokens.value, ...t22Tokens.value];
      return mcpText(
        JSON.stringify(
          {
            vault: vaultPda.toBase58(),
            solBalance,
            tokens: allTokens.map((acc) => ({
              pubkey: acc.pubkey.toBase58(),
              mint: acc.account.data.parsed.info.mint,
              amount: acc.account.data.parsed.info.tokenAmount,
              programId: acc.account.owner.toBase58(),
            })),
          },
          null,
          2
        ),
        "Fetched SOL and token balances for the vault."
      );
    } catch (e: any) {
      return mcpError("Failed to fetch assets for vault", e?.message);
    }
  },
};

export default getAssetsTool;