import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL, VoterStakeRegistry } from "./idl";
import { DEFAULT_VSR_PROGRAM_ID } from "./utils";

export function VsrClient(connection: Connection, programId?: PublicKey) {
    const provider = new AnchorProvider(connection, {} as Wallet, {})
    
    return new Program<VoterStakeRegistry>(
        IDL as VoterStakeRegistry, 
        programId ?? DEFAULT_VSR_PROGRAM_ID, 
        provider
    )
}