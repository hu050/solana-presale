import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Presale } from "../../target/types/presale";
import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import { ALIEN_MINT, NETWORK, PDA_SEED, POOL_AUTH_PDA_SEED } from "../config";
import { getATAPublicKey, getCreatorKeypair, convert_to_wei_value_with_decimal } from "../utils";

const { Wallet } = anchor;

// Withdraw Token
const withdraw_token = async () => {
    try {
        const connection = new Connection(NETWORK, "confirmed");
        // -- variables
        const creatorKeypair = getCreatorKeypair();
        const user_wallet = creatorKeypair.publicKey;
        const withdraw_amount = 50;

        anchor.setProvider(new anchor.AnchorProvider(connection, new Wallet(creatorKeypair), anchor.AnchorProvider.defaultOptions()));
        const program = anchor.workspace.Presale as Program<Presale>;

        const POOL_AUTHORITY = PublicKey.findProgramAddressSync(
            [Buffer.from(POOL_AUTH_PDA_SEED)],
            program.programId
        );
        console.log(POOL_AUTHORITY[0].toBase58())
        // return;

        const POOL_ATA = await getATAPublicKey(ALIEN_MINT, POOL_AUTHORITY[0]);
        const ADMIN_ATA = await getATAPublicKey(ALIEN_MINT, user_wallet);

        // State Account
        const [state_account, _config_bump] = await PublicKey.findProgramAddress(
            [Buffer.from(PDA_SEED)],
            program.programId
        );
        const withdrawAmountWei = convert_to_wei_value_with_decimal(
            withdraw_amount, 9
        );

        // set pda to mint_authority
        const tx = await program.methods.withdrawToken(withdrawAmountWei).accounts({
            userAuthority: user_wallet,
            stateAccount: state_account,
            tokenMint: ALIEN_MINT,
            userTokenAta: ADMIN_ATA,
            poolToken: POOL_ATA,
            poolAuthority: POOL_AUTHORITY[0],
            systemProgram: anchor.web3.SystemProgram.programId
        }).rpc();
        console.log(tx);

    } catch (err) {
        console.log(err)
    }
}

withdraw_token();