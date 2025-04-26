import { z } from "zod";
import { resetConfig, saveConfig } from "../../utils/config-utils";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import { SquadsConfig } from "../../types";

const resetConfigTool = {
  name: "RESET_CONFIG",
  description: "Resets the config to default values.",
  schema: {},
  async run() {
    try {
      await resetConfig();
      const defaultConfig: SquadsConfig = {
        squads: {},
      };
      await saveConfig(defaultConfig);
      return mcpText("Config reset to default values.");
    } catch (e: any) {
      return mcpError("Failed to reset config", e?.message);
    }
  },
};

export default resetConfigTool;
