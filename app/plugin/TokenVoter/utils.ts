import { IdlAccounts, web3 } from "@coral-xyz/anchor";

export const DEFAULT_TOKEN_VOTER_PROGRAM_ID = new web3.PublicKey("BUsq2cFH6cmfYcoveaf52BkPaXUW3ZhTUnFybyaJrtkN")

export function registrarKey(realmAddress: web3.PublicKey, tokenMint: web3.PublicKey, programId: web3.PublicKey) {
  return web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("registrar"),
      realmAddress.toBuffer(),
      tokenMint.toBuffer()
    ],
    programId ?? DEFAULT_TOKEN_VOTER_PROGRAM_ID
  )[0]
}

export function tokenVwrKey(
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
    programId ?? DEFAULT_TOKEN_VOTER_PROGRAM_ID
  )
}

export function tokenVoterKey(
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
    programId ?? DEFAULT_TOKEN_VOTER_PROGRAM_ID
  )
}