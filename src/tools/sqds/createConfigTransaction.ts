import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import { sendTx } from "../../utils/send-tx";
import BN from "bn.js";
const actionSchema = z.discriminatedUnion("__kind", [
  z.object({
    __kind: z.literal("AddMember"),
    newMember: z.object({
      key: z.string(),
      permissions: z.union([
        z.literal("ALL"),
        z.array(z.enum(["VOTE", "EXECUTE", "INITIATE"])),
      ]),
    }),
  }),
  z.object({
    __kind: z.literal("RemoveMember"),
    oldMember: z.string(),
  }),
  z.object({
    __kind: z.literal("ChangeThreshold"),
    newThreshold: z.number().int().min(1),
  }),
  z.object({
    __kind: z.literal("SetTimeLock"),
    newTimeLock: z.number().int().min(0),
  }),
  z.object({
    __kind: z.literal("AddSpendingLimit"),
    createKey: z.string(),
    vaultIndex: z.number().int().min(0),
    mint: z.string(),
    amount: z.number().int().min(1),
    period: z.object({
      __kind: z.string(), // e.g. "Daily", "Weekly", etc.
      value: z.number().int().optional(), // for custom periods, if needed
    }),
    members: z.array(z.string()),
    destinations: z.array(z.string()),
  }),
  z.object({
    __kind: z.literal("RemoveSpendingLimit"),
    spendingLimit: z.string(),
  }),
  z.object({
    __kind: z.literal("SetRentCollector"),
    newRentCollector: z.string().nullable(),
  }),
]);

const createConfigTransactionTool = {
  name: "CREATE_CONFIG_TRANSACTION",
  description:
    "Create a config transaction for a Squads multisig. Supports actions: AddMember, RemoveMember, ChangeThreshold, SetTimeLock, AddSpendingLimit, RemoveSpendingLimit, SetRentCollector.",
  schema: {
    multisigAddress: z
      .string()
      .describe("The Squads multisig address to configure."),
    actions: z
      .array(actionSchema)
      .min(1)
      .describe("List of config actions to perform."),
  },
  async run(args: { multisigAddress: string; actions: any[] }) {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.keypair) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, keypair } = context;
      const multisigPda = new PublicKey(args.multisigAddress);
      // Fetch multisig account
      const multisigAccount =
        await multisig.accounts.Multisig.fromAccountAddress(
          connection,
          multisigPda
        );
      const currentTransactionIndex = Number(multisigAccount.transactionIndex);
      const newTransactionIndex = BigInt(currentTransactionIndex + 1);
      // Permissions helpers
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
            return Permission.Vote, Permission.Execute, Permission.Initiate;
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
      // Build actions
      const builtActions: any[] = args.actions.map((action: any) => {
        switch (action.__kind) {
          case "AddMember":
            return {
              __kind: "AddMember",
              newMember: {
                key: new PublicKey(action.newMember.key),
                permissions: getPermissions(action.newMember.permissions),
              },
            };
          case "RemoveMember":
            return {
              __kind: "RemoveMember",
              oldMember: new PublicKey(action.oldMember),
            };
          case "ChangeThreshold":
            return {
              __kind: "ChangeThreshold",
              newThreshold: action.newThreshold,
            };
          case "SetTimeLock":
            return {
              __kind: "SetTimeLock",
              newTimeLock: action.newTimeLock,
            };
          case "AddSpendingLimit":
            return {
              __kind: "AddSpendingLimit",
              createKey: new PublicKey(action.createKey),
              vaultIndex: action.vaultIndex,
              mint: new PublicKey(action.mint),
              amount: new BN(action.amount),
              period: (() => {
                // Map period input to the correct enum/struct for the SDK
                // Example: { __kind: "Daily" } or { __kind: "Custom", value: 123 }
                if (action.period.__kind === "Custom") {
                  return { __kind: "Custom", value: action.period.value };
                }
                return { __kind: action.period.__kind };
              })(),
              members: action.members.map((m: string) => new PublicKey(m)),
              destinations: action.destinations.map(
                (d: string) => new PublicKey(d)
              ),
            };
          case "RemoveSpendingLimit":
            return {
              __kind: "RemoveSpendingLimit",
              spendingLimit: new PublicKey(action.spendingLimit),
            };
          case "SetRentCollector":
            return {
              __kind: "SetRentCollector",
              newRentCollector: action.newRentCollector
                ? new PublicKey(action.newRentCollector)
                : null,
            };
          default:
            throw new Error(`Unknown action kind: ${action.__kind}`);
        }
      });
      // Create config transaction instruction
      const ix = multisig.instructions.configTransactionCreate({
        multisigPda,
        transactionIndex: newTransactionIndex,
        creator: keypair.publicKey,
        actions: builtActions,
        memo: `${builtActions
          .map((a) => a.__kind)
          .join(", ")} by ${keypair.publicKey.toBase58()}`,
        programId: multisig.PROGRAM_ID,
        rentPayer: keypair.publicKey,
      });
      // Send transaction
      const tx = await sendTx(connection, keypair, [ix]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send config transaction");
      }
      return mcpText(
        JSON.stringify(
          {
            multisigAddress: multisigPda.toBase58(),
            transactionIndex: newTransactionIndex.toString(),
            signature: tx.data,
          },
          null,
          2
        )
      );
    } catch (e: any) {
      return mcpError("Failed to create config transaction", e?.message);
    }
  },
};

export default createConfigTransactionTool;
