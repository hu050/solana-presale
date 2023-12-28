import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LpfiStaking } from "../../target/types/lpfi_staking";
import {
    Connection, PublicKey
} from "@solana/web3.js";
import { NETWORK, PDA_SEED } from "../config";
import { getCreatorKeypair } from "../utils";

const { Wallet } = anchor;

// Create reward
const transfer_ownership = async () => {
    try {
        const connection = new Connection(NETWORK, "confirmed");
        // -- Variable
        const creatorKeypair = getCreatorKeypair();
        const user_wallet = creatorKeypair.publicKey;

        anchor.setProvider(new anchor.AnchorProvider(connection, new Wallet(creatorKeypair), anchor.AnchorProvider.defaultOptions()));
        const program = anchor.workspace.LpfiStaking as Program<LpfiStaking>;
        // Config
        const [config, _config_bump] = await PublicKey.findProgramAddress(
            [Buffer.from(PDA_SEED)],
            program.programId
        );

        const newAdmin = new PublicKey("BTu6x99R9Tay73YJ5h2p4iWtEfw2DhovHkiuL94Kafqw");

        // initialize  
        await program.methods.updateOwner(newAdmin).
            accounts({
                owner: user_wallet,
                config: config
            }).rpc();

    } catch (err) {
        console.log(err)
    }
}

transfer_ownership();