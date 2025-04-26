import { z } from "zod";
import { setConnection } from "../../utils/config-utils";
import { mcpText, mcpError } from "../../utils/mcp-helpers";

const connectionUpdateTool = {
  name: "CONNECTION_UPDATE",
  description:
    "Set the Solana connection by cluster name (devnet, testnet, mainnet) or a custom rpcEndpoint URL.",
  schema: {
    cluster: z
      .string()
      .optional()
      .describe("Cluster name: devnet, testnet, or mainnet-beta."),
    rpcEndpoint: z
      .string()
      .optional()
      .describe("Custom Solana RPC endpoint URL."),
  },
  async run({
    cluster,
    rpcEndpoint,
  }: {
    cluster?: string;
    rpcEndpoint?: string;
  }) {
    try {
      let url = rpcEndpoint;
      if (!url && cluster) {
        if (cluster === "devnet") url = "https://api.devnet.solana.com";
        else if (cluster === "testnet") url = "https://api.testnet.solana.com";
        else if (cluster === "mainnet" || cluster === "mainnet-beta")
          url = "https://api.mainnet-beta.solana.com";
        else return mcpError(`Unknown cluster: ${cluster}`);
      }
      if (!url)
        return mcpError("You must provide either a cluster or rpcEndpoint.");
      await setConnection(url);
      return mcpText(`Connection set to ${url}`);
    } catch (e: any) {
      return mcpError("Failed to set connection", e?.message);
    }
  },
};

export default connectionUpdateTool;
