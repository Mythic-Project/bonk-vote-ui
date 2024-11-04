import { IdlAccounts, web3 } from "@coral-xyz/anchor";
import { VsrIdl } from "./type";
import { PublicKey } from "@solana/web3.js";

export const DEFAULT_TOKEN_VOTER_PROGRAM_ID = new web3.PublicKey("vsr2nfGVNHmSY8uxoBGqq8AQbwz3JwaEaHqGbsTPXqQ")
export const SECONDARY_VSR_MINT = new PublicKey("FYUjeMAFjbTzdMG91RSW5P4HT2sT7qzJQgDPiPG9ez9o")

type Registrar = IdlAccounts<VsrIdl>["registrar"];
type Voter = IdlAccounts<VsrIdl>["voter"];

export interface VoterWithRegistrar {
  registrar: Registrar,
  voter: Voter,
  registrarKey: PublicKey,
  voterKey: PublicKey,
  programId: PublicKey
}

export function registrarKey(realmAddress: web3.PublicKey, tokenMint: web3.PublicKey, programId: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      realmAddress.toBuffer(),
      Buffer.from("registrar"),
      tokenMint.toBuffer()
    ],
    programId
  )[0]
}

export function vsrVoterKey(
  realmAddress: web3.PublicKey, 
  tokenMint: web3.PublicKey, 
  authority: web3.PublicKey, 
  programId: web3.PublicKey) 
{
  const registrar = registrarKey(realmAddress, tokenMint, DEFAULT_TOKEN_VOTER_PROGRAM_ID)

  return web3.PublicKey.findProgramAddressSync(
    [
      registrar.toBytes(),
      Buffer.from("voter"),
      authority.toBytes()
    ],
    programId
  )
}

export function vwrRecordKey(
  realmAddress: web3.PublicKey, 
  tokenMint: web3.PublicKey, 
  authority: web3.PublicKey, 
  programId: web3.PublicKey) 
{
  const registrar = registrarKey(realmAddress, tokenMint, DEFAULT_TOKEN_VOTER_PROGRAM_ID)

  return web3.PublicKey.findProgramAddressSync(
    [
      registrar.toBytes(),
      Buffer.from("voter-weight-record"),
      authority.toBytes()
    ],
    programId
  )
}