import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const showConfigTool = {
  name: "SHOW_CONFIG",
  description:
    "Displays the current configuration, wallet balance, and active Squads multisig address.",
  schema: {},
  async run() {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.wallet) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, wallet, multisigAddress } = context;
      // Optionally, fetch balance if keypair is available
      let balance = undefined;
      if (context.keypair && context.connection) {
        try {
          balance = await context.connection.getBalance(
            context.keypair.publicKey
          );
        } catch {}
      }
      return mcpText(
        JSON.stringify(
          {
            connection,
            wallet: wallet ? { ...wallet, privateKey: "[hidden]" } : undefined,
            walletBalance:
              balance !== undefined ? balance / LAMPORTS_PER_SOL : undefined,
            activeSquadsMultisig: multisigAddress?.toBase58(),
          },
          null,
          2
        )
      );
    } catch (e: any) {
      return mcpError("Failed to show config", e?.message);
    }
  },
};

export default showConfigTool;
