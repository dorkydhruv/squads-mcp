import { z } from "zod";
import { setActiveSquadsMultisig } from "../../utils/config-utils";
import { mcpText, mcpError } from "../../utils/mcp-helpers";

const importSquadsMultisigTool = {
  name: "IMPORT_SQUADS_MULTISIG",
  description:
    "Import and set an existing Squads multisig address as active in the config.",
  schema: {
    multisigAddress: z
      .string()
      .min(1)
      .describe("The Squads multisig address to import and set as active."),
  },
  async run({ multisigAddress }: { multisigAddress: string }) {
    try {
      await setActiveSquadsMultisig(multisigAddress);
      return mcpText(`Active Squads multisig set to: ${multisigAddress}`);
    } catch (e: any) {
      return mcpError("Failed to import Squads multisig", e?.message);
    }
  },
};

export default importSquadsMultisigTool;
