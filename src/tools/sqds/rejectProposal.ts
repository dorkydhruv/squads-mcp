import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";

const rejectProposal = {
  name: "REJECT_PROPOSAL",
  description:
    "Reject a proposal for a Squads multisig transaction. Member must have 'Voter' permissions. SECURITY: Always verify the proposal details and transaction index before rejecting. Use a secure device and confirm the action with your team if possible.",
  schema: {
    multisigAddress: z
      .string()
      .describe(
        "The Squads multisig address. SECURITY: Double-check this address before rejecting."
      ),
    transactionIndex: z
      .union([z.string(), z.number()])
      .describe(
        "The transaction index to reject (as string or number). SECURITY: Confirm this matches the intended proposal."
      ),
    member: z
      .string()
      .describe(
        "The public key of the member rejecting the proposal. SECURITY: Use a hardware wallet if possible."
      ),
  },
  async run(args: {
    multisigAddress: string;
    transactionIndex: string | number;
    member: string;
  }) {
    try {
      const context = await useMcpContext();
      if (!context.connection || !context.keypair) {
        return mcpError("No wallet or connection configured.");
      }
      const { connection, keypair } = context;
      const multisigPda = new PublicKey(args.multisigAddress);
      const transactionIndex =
        typeof args.transactionIndex === "string"
          ? BigInt(args.transactionIndex)
          : BigInt(args.transactionIndex);
      const member = new PublicKey(args.member);
      const ix = multisig.instructions.proposalReject({
        multisigPda,
        transactionIndex,
        member,
      });
      const { sendTx } = await import("../../utils/send-tx");
      const tx = await sendTx(connection, keypair, [ix]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send proposal rejection transaction");
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
        ),
        "Next step: Notify your team of the rejection. If you need to propose a new transaction, use CREATE_PROPOSAL."
      );
    } catch (e: any) {
      return mcpError("Failed to reject proposal", e?.message);
    }
  },
};

export default rejectProposal;
