declare module '*/contracts.json' {
  const value: {
    network: string;
    chainId: number;
    rpcUrl: string;
    contracts: {
      MockUSDC: { address: string; abi: any[] };
      AgentDreamsEscrow: { address: string; abi: any[] };
    };
    accounts: {
      deployer: string;
      settler: string;
    };
  };
  export default value;
}
