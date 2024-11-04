import { AnchorProvider, IdlTypes, Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl.json";
import {VsrIdl} from "./type";


export function VsrClient(connection: Connection) {
  const provider = new AnchorProvider(connection, {} as Wallet, {})
  
  return new Program<VsrIdl>(
    idl as VsrIdl,
    provider
  )
}