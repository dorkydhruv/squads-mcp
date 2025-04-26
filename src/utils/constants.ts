import path from "path";
import os from "os";

export const CONFIG_DIR = path.join(os.homedir(), ".config");
export const CONFIG_PATH = path.join(CONFIG_DIR, "squads-mcp.json");

export const DEFAULT_RPC_ENDPOINT = 'https://localhost:8899';