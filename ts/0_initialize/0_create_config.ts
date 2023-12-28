import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Presale } from "../../target/types/presale";
import { Connection, SYSVAR_RENT_PUBKEY, PublicKey } from "@solana/web3.js";
import {
  ALIEN_MINT,
  NETWORK,
  PDA_SEED,
  POOL_AUTH_PDA_SEED,
} from "../config";
import {
  getATAPublicKey,
  getCreatorKeypair,
} from "../utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const { Wallet } = anchor;

// Create config
const create_config = async () => {
  try {
    const connection = new Connection(NETWORK, "confirmed");
    // -- Variable
    const creatorKeypair = getCreatorKeypair();
    const user_wallet = creatorKeypair.publicKey;

    anchor.setProvider(
      new anchor.AnchorProvider(
        connection,
        new Wallet(creatorKeypair),
        anchor.AnchorProvider.defaultOptions()
      )
    );
    const program = anchor.workspace.Presale as Program<Presale>;

    // State Account
    const [state_account, _config_bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(PDA_SEED)],
      program.programId
    );
    console.log("State Account:", state_account.toBase58());
    // 8LjMZLQhQHkpGGa4rJ5cfFNHpXtDvRaWKxGtCFxosb5T
    const POOL_AUTHORITY = PublicKey.findProgramAddressSync(
      [Buffer.from(POOL_AUTH_PDA_SEED)],
      program.programId
    );
    console.log("POOL_AUTHORITY:", POOL_AUTHORITY[0].toBase58());

    const POOL_ATA = await getATAPublicKey(ALIEN_MINT, POOL_AUTHORITY[0]);
    console.log("POOL_ATA:", POOL_ATA.toBase58());
    // initialize
    await program.methods
      .initialize()
      .accounts({
        userAuthority: user_wallet,
        stateAccount: state_account,
        tokenMint: ALIEN_MINT,
        poolAta: POOL_ATA,
        poolAuthority: POOL_AUTHORITY[0],
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
  } catch (err) {
    console.log(err);
  }
};

create_config();
