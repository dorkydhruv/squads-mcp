import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";

const getProposalsTool = {
  name: "GET_PROPOSALS",
  description: `Fetch all proposals for a given Squads multisig account. Proposals handle consensus for a given transaction, storing voting status and tallies.`,
  schema: {
    multisigAddress: z
      .string()
      .describe("The Squads multisig address to fetch proposals for."),
  },
  async run(args: { multisigAddress: string }) {
    try {
      const context = await useMcpContext();
      if (!context || !context.connection) {
        return mcpError("No connection configured.");
      }
      const { connection } = context;
      const multisigPda = new PublicKey(args.multisigAddress);

      // Fetch the multisig account
      const multisigAccount =
        await multisig.accounts.Multisig.fromAccountAddress(
          connection,
          multisigPda
        );

      const proposals: any = [];
      const staleIndex = Number(multisigAccount.staleTransactionIndex);
      const currentIndex = Number(multisigAccount.transactionIndex);

      // Iterate through all transaction indices to fetch proposals
      for (let index = staleIndex; index <= currentIndex; index++) {
        const transactionIndex = BigInt(index);
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

          proposals.push(proposalAccount);
        } catch (error) {
          // Skip if proposal does not exist
        }
      }

      return mcpText(
        `Proposals fetched successfully: ${JSON.stringify(proposals, null, 2)}`
      );
    } catch (error: any) {
      return mcpError(
        `Failed to fetch proposals: ${JSON.stringify(error?.message)}`
      );
    }
  },
};

export default getProposalsTool;
