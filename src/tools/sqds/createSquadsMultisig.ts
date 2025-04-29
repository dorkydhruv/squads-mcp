import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { setActiveSquadsMultisig } from "../../utils/config-utils";
import { sendTx } from "../../utils/send-tx";

const createSquadsMultisigTool = {
  name: "CREATE_SQUADS_MULTISIG",
  description:
    "Create a squads multisig account on Solana blockchain. Expects a name, list of owner addresses, threshold, and permissions. SECURITY: For critical treasuries or upgrades, use 6+ members, 4/6+ threshold, time locks, and avoid ALL permissions for any single user.",
  schema: {
    name: z
      .string()
      .min(1)
      .max(50)
      .describe(
        "Name of the multisig account. SECURITY: Use a descriptive name for auditability."
      ),
    members: z
      .array(z.string())
      .min(1)
      .describe(
        "List of owners for the multisig account, always includes the creator. SECURITY: 6+ members recommended for critical treasuries or upgrades. Use hardware wallets for all signers."
      ),
    threshold: z
      .number()
      .int()
      .min(1)
      .describe(
        "Number of owners required to approve a transaction. SECURITY: 4/6 or higher recommended for treasury/upgrade accounts."
      ),
    permissionForMembers: z
      .union([
        z.literal("ALL"),
        z.array(z.enum(["VOTE", "EXECUTE", "INITIATE"])),
      ])
      .describe(
        "Permission for members. SECURITY: Avoid 'ALL'; separate INITIATE and EXECUTE roles for best security."
      )
      .optional()
      .default("ALL"),
    permissionForCreator: z
      .union([
        z.literal("ALL"),
        z.array(z.enum(["VOTE", "EXECUTE", "INITIATE"])),
      ])
      .describe(
        "Permission for creator. SECURITY: Avoid 'ALL'; separate INITIATE and EXECUTE roles for best security."
      )
      .optional()
      .default("ALL"),
    timeLock: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0)
      .describe(
        "Time lock in seconds. SECURITY: 3600s+ for Reserve, 600s+ for Program Upgrade recommended."
      ),
  },
  async run(args: {
    name: string;
    members: string[];
    threshold: number;
    permissionForCreator?: "ALL" | Array<"VOTE" | "EXECUTE" | "INITIATE">;
    permissionForMembers?: "ALL" | Array<"VOTE" | "EXECUTE" | "INITIATE">;
    timeLock?: number;
  }) {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.keypair) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, keypair } = context;
      const {
        name,
        members,
        threshold,
        permissionForMembers,
        permissionForCreator,
        timeLock,
      } = args;
      const createKey = Keypair.generate();
      // derive the multisig PDA
      const [multisigPda] = multisig.getMultisigPda({
        createKey: createKey.publicKey,
      });
      // derive & fetch the program config
      const [programConfigPda] = multisig.getProgramConfigPda({});
      const programConfig =
        await multisig.accounts.ProgramConfig.fromAccountAddress(
          connection,
          programConfigPda
        );
      const configTreasury = programConfig.treasury;
      // Helper function to convert permission string to Permission enum value
      const { Permissions, Permission } = multisig.types;
      const permissionToEnum = (perm: string) => {
        switch (perm) {
          case "VOTE":
            return Permission.Vote;
          case "EXECUTE":
            return Permission.Execute;
          case "INITIATE":
            return Permission.Initiate;
          default:
            return Permission.Execute, Permission.Initiate, Permission.Vote;
        }
      };
      const getPermissions = (permInput: any) => {
        if (!permInput || permInput === "ALL") return Permissions.all();
        if (Array.isArray(permInput)) {
          const permEnums = permInput.map(permissionToEnum).filter(Boolean);
          return Permissions.fromPermissions(permEnums);
        }
        return Permissions.all();
      };
      // build the member list with permissions
      const memberConfigs = members.map((m) => {
        const pub = new PublicKey(m);
        const isCreator = pub.equals(keypair.publicKey);
        const perms = isCreator
          ? getPermissions(permissionForCreator)
          : getPermissions(permissionForMembers);
        return { key: pub, permissions: perms };
      });
      // create the multisig instruction
      const createIx = multisig.instructions.multisigCreateV2({
        createKey: createKey.publicKey,
        creator: keypair.publicKey,
        multisigPda,
        configAuthority: null,
        timeLock: timeLock ?? 0,
        members: memberConfigs,
        threshold,
        treasury: configTreasury,
        rentCollector: null,
        memo: `${name} created by ${keypair.publicKey.toBase58()}`,
      });
      // send transaction
      const tx = await sendTx(connection, keypair, [createIx], [createKey]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send transaction");
      }
      const sig = tx.data;
      // store the new multisig address
      if (context.multisigAddress !== multisigPda) {
        // Optionally, update config if needed
        await setActiveSquadsMultisig(multisigPda.toBase58());
      }
      return mcpText(
        JSON.stringify(
          {
            multisigAddress: multisigPda.toBase58(),
            signature: sig,
          },
          null,
          2
        ),
        "Next step: Create your first transaction, then create a proposal for it to begin the approval process."
      );
    } catch (e: any) {
      return mcpError("Failed to create squads multisig", e?.message);
    }
  },
};

export default createSquadsMultisigTool;
