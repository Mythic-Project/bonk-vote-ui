import { AnchorProvider, Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl.json";
import {BonkPlugin} from "./type";

export function BonkPluginClient(connection: Connection, programId?: web3.PublicKey) {
  const provider = new AnchorProvider(connection, {} as Wallet, {})
  
  return new Program<BonkPlugin>(
    idl as BonkPlugin,
    provider
  )
}