import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Presale } from "../../target/types/presale";
import {
    Connection,
    PublicKey,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import { ALIEN_MINT, NETWORK, PDA_SEED, POOL_AUTH_PDA_SEED } from "../config";
import { getATAPublicKey, getCreatorKeypair, convert_to_wei_value_with_decimal } from "../utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const { Wallet } = anchor;

// Deposit SOL
const deposit_sol = async () => {
    try {
        const connection = new Connection(NETWORK, "confirmed");
        // -- variables
        const creatorKeypair = getCreatorKeypair();
        const user_wallet = creatorKeypair.publicKey;
        const deposit_amount = 0.1;

        anchor.setProvider(new anchor.AnchorProvider(connection, new Wallet(creatorKeypair), anchor.AnchorProvider.defaultOptions()));
        const program = anchor.workspace.Presale as Program<Presale>;

        const reward_mint = ALIEN_MINT; // LPFI_MINT; //

        const POOL_AUTHORITY = await PublicKey.findProgramAddress(
            [Buffer.from(POOL_AUTH_PDA_SEED)],
            program.programId
        );

        const POOL_ATA = await getATAPublicKey(reward_mint, POOL_AUTHORITY[0]);
        const ADMIN_ATA = await getATAPublicKey(reward_mint, user_wallet);

        // Config
        const [config, _config_bump] = await PublicKey.findProgramAddress(
            [Buffer.from(PDA_SEED)],
            program.programId
        );
        const depositAmountWei = convert_to_wei_value_with_decimal(
            deposit_amount, 9
        );

        console.log("Pool authority: ", POOL_AUTHORITY[0].toBase58())
        // set pda to mint_authority
        const tx = await program.methods.depositSol(depositAmountWei).accounts({
            userAuthority: user_wallet,
            stateAccount: config,
            tokenMint: ALIEN_MINT,
            userTokenAta: ADMIN_ATA,
            poolAuthority: POOL_AUTHORITY[0],
            poolToken: POOL_ATA,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY
        }).rpc();
        console.log(tx);
    } catch (err) {
        console.log(err)
    }
}

deposit_sol();