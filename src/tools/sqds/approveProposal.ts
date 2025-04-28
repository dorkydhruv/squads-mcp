import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";

const approveProposal = {
  name: "APPROVE_PROPOSAL",
  description:
    "Approve a proposal for a Squads multisig transaction. Member must have 'Voter' permissions.",
  schema: {
    multisigAddress: z.string().describe("The Squads multisig address."),
    transactionIndex: z
      .union([z.string(), z.number()])
      .describe("The transaction index to approve (as string or number)."),
    member: z
      .string()
      .describe("The public key of the member approving the proposal."),
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
      const ix = await multisig.instructions.proposalApprove({
        multisigPda,
        transactionIndex,
        member,
      });
      const { sendTx } = await import("../../utils/send-tx");
      const tx = await sendTx(connection, keypair, [ix]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send proposal approval transaction");
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
      return mcpError("Failed to approve proposal", e?.message);
    }
  },
};

export default approveProposal;
