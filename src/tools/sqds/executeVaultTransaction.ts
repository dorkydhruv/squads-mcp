import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";

const executeVaultTransaction = {
  name: "executeVaultTransaction",
  description:
    "Execute an approved vault transaction for a Squads multisig. Member must have 'Executor' permissions and the proposal must be approved.",
  schema: {
    multisigAddress: z.string().describe("The Squads multisig address."),
    transactionIndex: z.union([z.string(), z.number()]).describe("The transaction index to execute (as string or number)."),
    member: z.string().describe("The public key of the member executing the vault transaction."),
  },
  async run(args: { multisigAddress: string; transactionIndex: string | number; member: string }) {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.keypair) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, keypair } = context;
      const multisigPda = new PublicKey(args.multisigAddress);
      const transactionIndex = typeof args.transactionIndex === "string" ? BigInt(args.transactionIndex) : BigInt(args.transactionIndex);
      const member = new PublicKey(args.member);
      const ix = await multisig.instructions.vaultTransactionExecute({
        connection,
        multisigPda,
        transactionIndex,
        member,
      });
      const { sendTx } = await import("../../utils/send-tx");
      const tx = await sendTx(connection, keypair, [ix.instruction]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send vault transaction execution");
      }
      return mcpText(
        JSON.stringify(
          {
            multisigAddress: multisigPda.toBase58(),
            transactionIndex: transactionIndex.toString(),
            signature: tx.data,
          },
          null,
          2
        )
      );
    } catch (e: any) {
      return mcpError("Failed to execute vault transaction", e?.message);
    }
  },
};

export default executeVaultTransaction;