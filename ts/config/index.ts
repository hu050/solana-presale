import { PublicKey } from "@solana/web3.js";

// State Account: 8LjMZLQhQHkpGGa4rJ5cfFNHpXtDvRaWKxGtCFxosb5T
// POOL_AUTHORITY: GHNKxgFq6sjCrepebCo2S8D6SmynzSQ3jdc2YhacJTQz
// POOL_ATA: 8yR3FBdRK4ZJ4UTJh7Y6ewVY6mq5ggHSZqpDZ3qh2Y8p

// export const NETWORK = "https://api.mainnet-beta.solana.com";
export const NETWORK = "https://api.devnet.solana.com";

export const ADMIN = new PublicKey(
  "AZzscKGxcnS25oyvcLWoYWAQPE4uv4pycXR8ANq1HkmD"
);

export const PDA_SEED = "aliensale";
export const POOL_AUTH_PDA_SEED = "pool-auth";

// ----  mainnet-beta ----
// export const ALIEN_MINT = new PublicKey("LPFiNAybMobY5oHfYVdy9jPozFBGKpPiEGoobK2xCe3")

// ----  devnet ----
export const ALIEN_MINT = new PublicKey(
  "GtbRPKm68688fABPP1E21ZeHbVdCmBz5bqnAqUabfKYU"
);

// SOL mint
export const SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
