import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import * as fs from "fs";

export const getCreatorKeypair = () => {
  const path = `./pk/user.json`
  const pk = Uint8Array.from(
    JSON.parse(fs.readFileSync(path) as unknown as string)
  );
  const keypair = Keypair.fromSecretKey(pk);
  return keypair;
}

export const getATAPublicKey = async (tokenMint: PublicKey, owner: PublicKey) => {
  return await getAssociatedTokenAddress(
    tokenMint,
    owner,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )
}
export const getTokenATABalance = async (connection, tokenATA) => {
  const tokenATAInfo = await getAccount(
    connection,
    tokenATA
  );
  return new anchor.BN(tokenATAInfo.amount.toString())
}
export const getPublicKey = (name: string) =>
  new PublicKey(
    JSON.parse(fs.readFileSync(`./keys/${name}_pub.js`) as unknown as string)
  );

export const writePublicKey = (publicKey: PublicKey, name: string) => {
  fs.writeFileSync(
    `./keys/${name}_pub.js`,
    JSON.stringify(publicKey.toString())
  );
};

export const tokenBalance = async (connection: Connection, ata: PublicKey) => {
  const accountInfo = await connection.getTokenAccountBalance(ata);
  return accountInfo.value.uiAmount;
}

export const convert_to_wei_value_with_decimal = (val, decimal) => {
  const decimalBN = Math.pow(10, decimal);

  const wei_value = Number(val) * Number(decimalBN);
  return new anchor.BN(wei_value.toString());

}

export const convert_from_wei_value_with_decimal = (wei_value, decimal) => {
  const decimalBN = Math.pow(10, decimal);

  const val = Number(wei_value) / Number(decimalBN);
  return val;

}

export const checkAccountExists = async (connection: Connection, pub: PublicKey) => {
  const accountInfo = await connection.getAccountInfo(pub);
  if (!accountInfo || accountInfo.data.length == 0) return false;
  return true;
}