import { AnchorProvider, IdlTypes, Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "./idl.json";
import {StakeIdl} from "./type";

export type StakeDepositReceiptType = IdlTypes<StakeIdl>["stakeDepositReceipt"];

export function StakeIdlClient(connection: Connection, programId?: web3.PublicKey) {
  const provider = new AnchorProvider(connection, {} as Wallet, {})
  
  return new Program<StakeIdl>(
    idl as StakeIdl,
    provider
  )
}