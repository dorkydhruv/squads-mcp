import fs from "fs-extra";
import {
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { SquadsConfig, SquadsWallet } from "../types";
import {
  CONFIG_PATH,
  CONFIG_DIR,
  DEFAULT_RPC_ENDPOINT,
} from "../utils/constants";

export async function getConfig(): Promise<SquadsConfig | null> {
  try {
    await fs.ensureDir(CONFIG_DIR);
    if (!fs.existsSync(CONFIG_PATH)) return null;
    return (await fs.readJSON(CONFIG_PATH)) as SquadsConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: SquadsConfig): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
  await fs.writeJSON(CONFIG_PATH, config, { spaces: 2 });
}

export async function resetConfig(): Promise<void> {
  await fs.remove(CONFIG_PATH);
}

export async function setConnection(rpcUrl: string): Promise<void> {
  let config = (await getConfig()) || {
    squads: { rpcUrl },
    wallet: { privateKey: "", rpcUrl },
  };
  config.squads.rpcUrl = rpcUrl;
  if (config.wallet) config.wallet.rpcUrl = rpcUrl;
  await saveConfig(config);
}

export async function setWalletPrivateKey(privateKey: string): Promise<void> {
  let config = (await getConfig()) || {
    squads: {},
    wallet: { privateKey, rpcUrl: "" },
  };
  if (!config.wallet) {
    config.wallet = { privateKey, rpcUrl: "" };
  } else {
    config.wallet.privateKey = privateKey;
  }
  await saveConfig(config);
}

export async function getWallet(): Promise<SquadsWallet | null> {
  const config = await getConfig();
  return config?.wallet || null;
}

export async function getConnection(): Promise<Connection | null> {
  const config = await getConfig();
  const rpcUrl = config?.squads?.rpcUrl;
  if (!rpcUrl) return null;
  return new Connection(rpcUrl, "confirmed");
}

export function getKeypairFromPrivateKey(privateKey: string): Keypair {
  // privateKey is base58 or array string
  if (privateKey.startsWith("[") && privateKey.endsWith("]")) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)));
  }
  // assume base58
  const bs58 = require("bs58");
  return Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privateKey)));
}

export async function getWalletBalance(): Promise<number | null> {
  const wallet = await getWallet();
  if (!wallet?.privateKey || !wallet.rpcUrl) return null;
  const keypair = getKeypairFromPrivateKey(wallet.privateKey);
  const connection = new Connection(wallet.rpcUrl, "confirmed");
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

export async function setActiveSquadsMultisig(
  multisigAddress: string
): Promise<void> {
  let config = (await getConfig()) || {
    squads: {
      multisigAddress: "",
      rpcUrl: DEFAULT_RPC_ENDPOINT,
    },
  };
  config.squads = { ...config.squads, multisigAddress };
  await saveConfig(config);
}

export async function getActiveSquadsMultisig(): Promise<string | undefined> {
  const config = await getConfig();
  return config?.squads?.multisigAddress;
}
