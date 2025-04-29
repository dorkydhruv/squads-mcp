import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";

const getProposalTool = {
  name: "GET_PROPOSAL",
  description:
    "Fetch a single proposal for a given Squads multisig account and transaction index. SECURITY: Always verify the multisig address and transaction index before reviewing proposal details.",
  schema: {
    multisigAddress: z
      .string()
      .describe(
        "The Squads multisig address to fetch the proposal for. SECURITY: Double-check this address."
      ),
    transactionIndex: z
      .union([z.string(), z.number()])
      .describe(
        "The transaction index of the proposal. SECURITY: Confirm this matches the intended proposal."
      ),
  },
  async run(args: {
    multisigAddress: string;
    transactionIndex: string | number;
  }) {
    try {
      const context = await useMcpContext();
      if (!context || !context.connection) {
        return mcpError("No connection configured.");
      }
      const { connection } = context;
      const multisigPda = new PublicKey(args.multisigAddress);
      const transactionIndex =
        typeof args.transactionIndex === "string"
          ? BigInt(args.transactionIndex)
          : BigInt(args.transactionIndex);
      const [proposalPda] = multisig.getProposalPda({
        multisigPda,
        transactionIndex,
      });
      try {
        const proposalAccount =
          await multisig.accounts.Proposal.fromAccountAddress(
            connection,
            proposalPda
          );
        return mcpText(
          `Proposal fetched successfully: ${JSON.stringify(
            proposalAccount,
            null,
            2
          )}`,
          "If this proposal is not yet approved, you may need to collect more votes. Use GET_PROPOSALS to see all proposals and their status."
        );
      } catch (error) {
        return mcpError(
          `Proposal not found for transaction index ${transactionIndex}. It may not exist or has not been created yet.`,
          "If you just created a transaction, remember to create a proposal for it."
        );
      }
    } catch (error: any) {
      return mcpError(
        `Failed to fetch proposal: ${JSON.stringify(error?.message)}`
      );
    }
  },
};

export default getProposalTool;
