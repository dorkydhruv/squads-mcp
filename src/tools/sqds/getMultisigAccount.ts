import { z } from "zod";
import { PublicKey, Connection } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError } from "../../utils/mcp-helpers";

const getMultisigAccountTool = {
  name: "GET_MULTISIG_ACCOUNT",
  description: `Main configuration account for Squads multisigs. The Multisig account serves as the global config for your Squad. This stores all data related to membership, permissions, thresholds, and more. It will be required for every instruction method and account derivation with the SDK. The account address itself is derived via a createKey, which is a public key used as a seed. It is recommended to generate a one-time keypair for the createKey to avoid collisions, and save the public key, or the resulting multisig address for later use.`,
  schema: {
    createKey: z
      .string()
      .describe(
        "The public key used to derive the multisig address. Not required for all operations."
      )
      .optional(),
    multisigAddress: z
      .string()
      .describe(
        "The Squads multisig address to import and set as active. Prefered over createKey."
      )
      .optional(),
  },
  async run(args: { createKey?: string; multisigAddress: string }) {
    const context = await useMcpContext();
    if (!context || !context.connection) {
      return mcpError("No connection configured.");
    }
    let multisigAddress = args.multisigAddress;
    if (!multisigAddress && args.createKey) {
      // If no multisig address is provided, derive it from the createKey
      const createKey = new PublicKey(args.createKey);
      const multisigPda = multisig.getMultisigPda({ createKey });
      multisigAddress = multisigPda[0].toBase58();
    }
    try {
      // Use the provided multisig address
      const multisigPda = new PublicKey(args.multisigAddress);
      // Fetch the multisig account
      const multisigAccount =
        await multisig.accounts.Multisig.fromAccountAddress(
          context.connection,
          multisigPda
        );

      return multisigAccount;
    } catch (error) {
      return mcpError(
        `Failed to fetch multisig account ${JSON.stringify(error)}`
      );
    }
  },
};

export default getMultisigAccountTool;
