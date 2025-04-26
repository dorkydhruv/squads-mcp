import createConfigTransactionTool from "./createConfigTransaction";
import createSquadsMultisigTool from "./createSquadsMultisig";
import importSquadsMultisigTool from "./importSquadsMultisig";
import createVaultTransaction from "./createVaultTransaction";
import createProposal from "./createProposal";
export const sqdsTools = [
  createSquadsMultisigTool,
  importSquadsMultisigTool,
  createConfigTransactionTool,
  createVaultTransaction,
  createProposal,
];
