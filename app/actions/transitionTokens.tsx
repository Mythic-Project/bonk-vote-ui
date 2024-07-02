import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { DepositEntry, Registrar, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";
import { Program } from "@coral-xyz/anchor";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";

async function transitionTokensHandler(
  connection: Connection,
  wallet: WalletContextState,
  ixClient: Governance,
  realmAccount: PublicKey,
  tokenMint: PublicKey,
  userAccount: PublicKey,
  amount: BN,
  registrarData: Registrar,
  vsrClient: Program<VoterStakeRegistry>,
  voteRecords: VoteRecordWithGov[],
  tokenOwnerRecord: TokenOwnerRecord
) {
    
  const ixs: TransactionInstruction[] = []

  const userAta = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: userAccount
  })

  // Relinquish existing votes
  if (tokenOwnerRecord.outstandingProposalCount > 0) {
    throw new Error("The user has the outstanding proposals. Can't withdraw the tokens.")
  }

  voteRecords.forEach(async(voteRecord) => {
    const relinquishIx = await ixClient.relinquishVoteInstruction(
        realmAccount,
        voteRecord.governance,
        voteRecord.proposal,
        tokenOwnerRecord.publicKey,
        tokenMint,
        userAccount,
        userAccount
    )

    ixs.push(relinquishIx)
  })
  
  // Withdraw tokens from the default TOR
  const vanillaWitdrawIx = await ixClient.withdrawGoverningTokensInstruction(
    realmAccount,
    tokenMint,
    userAta,
    userAccount
  )

  ixs.push(vanillaWitdrawIx)

  // VSR Deposit
  const [voterKey, voterBump] = voterRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
  const [vwrKey, vwrBump] = vsrRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
  const voterAta = anchor.utils.token.associatedAddress({mint: tokenMint, owner: voterKey})

  let deposits: DepositEntry[] = []

  try {
    const voterAccount = await vsrClient.account.voter.fetch(voterKey)
    deposits.push(...voterAccount.deposits)
  } catch {
    const createVoterIx = await vsrClient.methods.createVoter(voterBump, vwrBump)
    .accounts({
      registrar: registrarData.publicKey,
      voter: voterKey,
      voterAuthority: userAccount,
      voterWeightRecord: vwrKey,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      payer: userAccount
    }).instruction()
  
    ixs.push(createVoterIx)
  }

  let depositEntryIndex = 0

  let availableDeposit = deposits.findIndex(
      deposit => deposit.isUsed && deposit.lockup.kind.none && 
          registrarData.data.votingMints[deposit.votingMintConfigIdx].mint.equals(tokenMint)
  )

  if (availableDeposit === -1) {
    availableDeposit = deposits.findIndex(deposit => !deposit.isUsed)

    if (availableDeposit === -1 && deposits.length > 0) {
        throw new Error("No deposit entry space is available.")
    }

    availableDeposit = availableDeposit === -1 ? 0 : availableDeposit
    depositEntryIndex = availableDeposit

    const createDepositEntryIx = await vsrClient.methods.createDepositEntry(
      availableDeposit,
      {none: {}},
      null,
      0,
      false
    ).accounts({
      registrar: registrarData.publicKey,
      voter: voterKey,
      voterAuthority: userAccount,
      depositMint: tokenMint,
      vault: voterAta,
      payer: userAccount
    }).instruction()

    ixs.push(createDepositEntryIx)
  } else {
      depositEntryIndex = availableDeposit
  }

  const depositIx = await vsrClient.methods.deposit(
    depositEntryIndex, 
    amount
  ).accounts({
    registrar: registrarData.publicKey,
    voter: voterKey,
    vault: voterAta,
    depositToken: userAta,
    depositAuthority: userAccount
  }).instruction()
  
  ixs.push(depositIx)

  return await sendTransaction(connection, ixs, wallet)
} 
  
export default transitionTokensHandler