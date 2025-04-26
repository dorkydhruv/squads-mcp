export interface SquadsWallet {
  rpcUrl: string;
  privateKey: string;
}

export interface SquadsConfig {
  squads: {
    rpcUrl?: string;
    multisigAddress?: string;
  };
  wallet?: SquadsWallet | undefined;
}
