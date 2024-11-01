import { IdlAccounts, web3 } from "@coral-xyz/anchor";
import { BonkPlugin } from "./type";
import { PublicKey } from "@solana/web3.js";

export const DEFAULT_BONK_PLUGIN_PROGRAM_ID = new web3.PublicKey("9T5hXfLs1ju8shgeaPdtBXFHc8CpmmyPEpLHGEVUHiwz")

export type Registrar = {
  data: IdlAccounts<BonkPlugin>["registrar"],
  publicKey: PublicKey,
  programId: PublicKey
}

export type StakeDepositRecord = IdlAccounts<BonkPlugin>["stakeDepositRecord"]

export function registrarKey(realmAddress: web3.PublicKey, tokenMint: web3.PublicKey, programId: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("registrar"),
      realmAddress.toBuffer(),
      tokenMint.toBuffer()
    ],
    programId ?? DEFAULT_BONK_PLUGIN_PROGRAM_ID
  )[0]
}

export function bonkVwrKey(
  realmAddress: web3.PublicKey, 
  tokenMint: web3.PublicKey, 
  authority: web3.PublicKey, 
  programId: web3.PublicKey) 
{
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter-weight-record"),
      realmAddress.toBuffer(),
      tokenMint.toBuffer(),
      authority.toBytes()
    ],
    programId ?? DEFAULT_BONK_PLUGIN_PROGRAM_ID
  )
}

export function bonkSdrKey(
  voterWeightRecord: PublicKey,
  programId: PublicKey
) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("stake-deposit-record"),
      voterWeightRecord.toBuffer()
    ],
    programId ?? DEFAULT_BONK_PLUGIN_PROGRAM_ID
  )
}