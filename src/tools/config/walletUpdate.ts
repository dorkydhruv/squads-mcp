import { z } from "zod";
import { setWalletPrivateKey } from "../../utils/config-utils";
import { mcpText, mcpError } from "../../utils/mcp-helpers";

const walletUpdateTool = {
  name: "WALLET_UPDATE",
  description:
    "Import a wallet private key (bs58 or Uint8Array format) into the config.",
  schema: {
    privateKey: z
      .string()
      .min(1)
      .describe("Private key in bs58 or Uint8Array string format."),
  },
  async run({ privateKey }: { privateKey: string }) {
    try {
      await setWalletPrivateKey(privateKey);
      return mcpText("Wallet private key imported successfully.");
    } catch (e: any) {
      return mcpError("Failed to import wallet private key", e?.message);
    }
  },
};

export default walletUpdateTool;
