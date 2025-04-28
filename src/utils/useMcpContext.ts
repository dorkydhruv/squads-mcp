// provides connection, wallet, and activeSquadsMultisig using config-utils
import {
  getConnection,
  getWallet,
  getActiveSquadsMultisig,
  getKeypairFromPrivateKey,
} from "./config-utils";
import { PublicKey } from "@solana/web3.js";

export async function useMcpContext() {
  const connection = await getConnection();
  const wallet = await getWallet();
  const keypair = wallet?.privateKey
    ? getKeypairFromPrivateKey(wallet.privateKey)
    : undefined;
  const multisigAddressStr = await getActiveSquadsMultisig();
  const multisigAddress = multisigAddressStr
    ? new PublicKey(multisigAddressStr)
    : undefined;
  return {
    connection,
    keypair,
    multisigAddress,
  };
}
