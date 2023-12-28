import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Presale } from "../../target/types/presale";
import {
    Connection,
    PublicKey
} from "@solana/web3.js";
import { NETWORK, PDA_SEED } from "../config";
import { getCreatorKeypair, convert_to_wei_value_with_decimal } from "../utils";

const { Wallet } = anchor;

// Withdraw SOL
const withdraw_sol = async () => {
    try {
        const connection = new Connection(NETWORK, "confirmed");
        // -- variables
        const creatorKeypair = getCreatorKeypair();
        const user_wallet = creatorKeypair.publicKey;
        const withdraw_amount = 0.1;

        anchor.setProvider(new anchor.AnchorProvider(connection, new Wallet(creatorKeypair), anchor.AnchorProvider.defaultOptions()));
        const program = anchor.workspace.Presale as Program<Presale>;

        // State Account
        const [state_account, _config_bump] = PublicKey.findProgramAddressSync(
            [Buffer.from(PDA_SEED)],
            program.programId
        );
        const withdrawAmountWei = convert_to_wei_value_with_decimal(
            withdraw_amount, 9
        );

        // set pda to mint_authority
        const tx = await program.methods.withdrawSol(withdrawAmountWei).accounts({
            userAuthority: user_wallet,
            stateAccount: state_account,
            systemProgram: anchor.web3.SystemProgram.programId
        }).rpc();
        console.log(tx);

    } catch (err) {
        console.log(err)
    }
}

withdraw_sol();