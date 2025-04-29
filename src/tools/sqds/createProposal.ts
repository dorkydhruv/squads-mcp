import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpText, mcpError } from "../../utils/mcp-helpers";
import * as multisig from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";

const createProposal = {
  name: "CREATE_PROPOSAL",
  description:
    "Create a proposal for a Squads multisig transaction. Proposals are required for voting and execution. SECURITY: Always verify the transaction index and proposal details. Use a secure device to create proposals for critical actions.",
  schema: {
    multisigAddress: z
      .string()
      .describe(
        "The Squads multisig address. SECURITY: Double-check this address before creating a proposal."
      ),
    transactionIndex: z
      .union([z.string(), z.number()])
      .describe(
        "The transaction index to propose (as string or number). SECURITY: Confirm this matches the intended transaction."
      ),
    creator: z
      .string()
      .describe(
        "The public key of the member creating the proposal. SECURITY: Use a hardware wallet if possible."
      ),
  },
  async run(args: {
    multisigAddress: string;
    transactionIndex: string | number;
    creator: string;
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
      const creator = new PublicKey(args.creator);
      const ix = multisig.instructions.proposalCreate({
        multisigPda,
        transactionIndex,
        creator,
      });
      const { sendTx } = await import("../../utils/send-tx");
      const tx = await sendTx(connection, keypair, [ix]);
      if (!tx || !tx.data) {
        return mcpError("Failed to send proposal transaction");
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
        "Next step: Have signers approve this proposal. Use the APPROVE_PROPOSAL tool, then check the proposal status with GET_PROPOSAL."
      );
    } catch (e: any) {
      return mcpError("Failed to create proposal", e?.message);
    }
  },
};

export default createProposal;
