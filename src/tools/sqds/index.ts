import createConfigTransactionTool from "./createConfigTransaction";
import createSquadsMultisigTool from "./createSquadsMultisig";
import importSquadsMultisigTool from "./importSquadsMultisig";
import createProposal from "./createProposal";
import approveProposal from "./approveProposal";
import rejectProposal from "./rejectProposal";
import cancelProposal from "./cancelProposal";
import executeConfigTransaction from "./executeConfigTransaction";
import executeVaultTransaction from "./executeVaultTransaction";
import getMultisigAccountTool from "./getMultisigAccount";
import fundVault from "./fundVault";
import transferSolFromVault from "./transferSolFromVault";
import getProposalsTool from "./getProposals";
import getProposalTool from "./getProposal";
import auditMultisigSecurity from "./auditMultisigSecurity";
import getAssetsTool from "./getAssets";

export const sqdsTools = [
  createSquadsMultisigTool,
  importSquadsMultisigTool,
  createConfigTransactionTool,
  createProposal,
  approveProposal,
  rejectProposal,
  cancelProposal,
  executeConfigTransaction,
  executeVaultTransaction,
  getMultisigAccountTool,
  fundVault,
  transferSolFromVault,
  getProposalsTool,
  getProposalTool,
  auditMultisigSecurity,
  getAssetsTool,
];
