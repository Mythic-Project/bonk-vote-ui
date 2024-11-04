import { Governance } from "test-governance-sdk";
import { AccountMeta, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { VsrIdl } from "../plugin/VoterStakeRegistry/type";
import { SECONDARY_VSR_MINT, VoterWithRegistrar, vwrRecordKey } from "../plugin/VoterStakeRegistry/utils";

async function vsrTransitionTokensHandler(
  connection: Connection,
  wallet: WalletContextState,
  ixClient: Governance,
  realmAccount: PublicKey,
  tokenMint: PublicKey,
  userAccount: PublicKey,
  tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
  voteRecords: VoteRecordWithGov[],
  vsrClient: Program<VsrIdl>,
  vsrRecord: VoterWithRegistrar
) {
    
  const ixs: TransactionInstruction[] = []

  const tokenOwnerRecordKey = ixClient.pda.tokenOwnerRecordAccount({
    realmAccount,
    governingTokenMintAccount: tokenMint,
    governingTokenOwner: userAccount
  }).publicKey

  const userAtaMain = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: userAccount
  })

  const userAtaSecondary = anchor.utils.token.associatedAddress({
    mint: SECONDARY_VSR_MINT,
    owner: userAccount
  })

  const vaultAtaMain = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: vsrRecord.voterKey
  })

  const vaultAtaSecondary = anchor.utils.token.associatedAddress({
    mint: SECONDARY_VSR_MINT,
    owner: vsrRecord.voterKey
  })

  if (tokenOwnerRecord) {
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
  }
  
  const [voterWeightRecord] = vwrRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)

  const vaultAccounts: AccountMeta[] = []
  let depositEntryIdx = 0
  let insertedMain = false
  let insertedSecondary = false
  for (const deposit of vsrRecord.voter.deposits) {
    const selectedMint = vsrRecord.registrar.votingMints[deposit.votingMintConfigIdx].mint;
    const isMainMint = selectedMint.equals(tokenMint)

    if (isMainMint) {
      const ataExists = await connection.getAccountInfo(userAtaMain)
      if (!ataExists && !insertedMain) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          userAccount, userAtaMain, userAccount, tokenMint, TOKEN_PROGRAM_ID
        )
        ixs.push(createAtaIx)
        insertedMain = true
      } 
    } else {
      const ataExists = await connection.getAccountInfo(userAtaSecondary)
      if (!ataExists && !insertedSecondary) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          userAccount, userAtaSecondary, userAccount, SECONDARY_VSR_MINT, TOKEN_PROGRAM_ID
        )
        ixs.push(createAtaIx)
        insertedSecondary = true
      }
    }

    if (deposit.isUsed && deposit.amountDepositedNative.gt(new BN(0))) {
      const withdrawIx = await vsrClient.methods.withdraw(
        depositEntryIdx,
        deposit.amountDepositedNative
      ).accounts({
        registrar: vsrRecord.registrarKey,
        voter: vsrRecord.voterKey,
        voterAuthority: userAccount,
        tokenOwnerRecord: tokenOwnerRecordKey,
        voterWeightRecord,
        vault: isMainMint ? vaultAtaMain : vaultAtaSecondary,
        destination: isMainMint ? userAtaMain : userAtaSecondary,
        tokenProgram: TOKEN_PROGRAM_ID
      }).instruction()

      ixs.push(withdrawIx)
      vaultAccounts.push(
        isMainMint ?
          {pubkey: vaultAtaMain, isSigner: false, isWritable: true} :
          {pubkey: vaultAtaSecondary, isSigner: false, isWritable: true}
      )
      depositEntryIdx += 1
    }
  }

  const closeVoterIx = await vsrClient.methods.closeVoter()
  .accounts({
    registrar: vsrRecord.registrarKey,
    voter: vsrRecord.voterKey,
    voterAuthority: userAccount,
    solDestination: userAccount,
    tokenProgram: TOKEN_PROGRAM_ID
  }).instruction()

  ixs.push(closeVoterIx)

  const signature = await sendTransaction(
    connection,
    ixs,
    wallet,
  )

  return signature
} 
  
export default vsrTransitionTokensHandler