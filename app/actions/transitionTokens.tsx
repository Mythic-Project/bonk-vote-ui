import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import { Registrar, bonkSdrKey, bonkVwrKey } from "../plugin/BonkPlugin/utils";
import { BonkPlugin } from "../plugin/BonkPlugin/type";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";
import { TokenVoter } from "../plugin/TokenVoter/type";
import { registrarKey, tokenVoterKey, tokenVwrKey } from "../plugin/TokenVoter/utils";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

async function transitionTokensHandler(
  connection: Connection,
  wallet: WalletContextState,
  ixClient: Governance,
  realmAccount: PublicKey,
  tokenMint: PublicKey,
  userAccount: PublicKey,
  registrarData: Registrar,
  bonkClient: Program<BonkPlugin>,
  tokenClient: Program<TokenVoter>,
  voteRecords: VoteRecordWithGov[],
  tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
  amount?: BN,
) {
    
  const ixs: TransactionInstruction[] = []

  const userAta = anchor.utils.token.associatedAddress({
    mint: tokenMint,
    owner: userAccount
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

    if (tokenOwnerRecord.governingTokenDepositAmount.gt(new BN(0))) {
      const isUserAtaExist = await connection.getAccountInfo(userAta)

      if (!isUserAtaExist) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          userAccount, userAta, userAccount, tokenMint, TOKEN_PROGRAM_ID
        )
        ixs.push(createAtaIx)
      }

      // Withdraw tokens from the default TOR
      const vanillaWitdrawIx = await ixClient.withdrawGoverningTokensInstruction(
        realmAccount,
        tokenMint,
        userAta,
        userAccount
      )

      ixs.push(vanillaWitdrawIx)
    }
  } else {
    const createTokenOwnerRecordIx = await ixClient.createTokenOwnerRecordInstruction(
      realmAccount, userAccount, tokenMint, userAccount
    )

    ixs.push(createTokenOwnerRecordIx)
  }
  
  const [tokenVwrAddress] = tokenVwrKey(realmAccount, tokenMint, userAccount, tokenClient.programId)
  const [bonkVwrAddress] = bonkVwrKey(realmAccount, tokenMint, userAccount, bonkClient.programId)
  const tokenRegistrarKey = registrarKey(realmAccount, tokenMint, tokenClient.programId)
  const tokenVoterAddress = tokenVoterKey(realmAccount, tokenMint, userAccount, tokenClient.programId)[0]

  const tokenVwr = await connection.getAccountInfo(tokenVwrAddress)

  if (!tokenVwr) {
    const createTokenVwrIx = await tokenClient.methods.createVoterWeightRecord()
    .accountsPartial({
      registrar: tokenRegistrarKey,
      voterAuthority: userAccount,
      voter: tokenVoterAddress
    }).instruction()

    ixs.push(createTokenVwrIx)
  }

  if (amount) {
    const depositTokenIx = await tokenClient.methods.deposit(0, amount)
    .accountsPartial({
      mint: tokenMint,
      tokenOwnerRecord: ixClient.pda.tokenOwnerRecordAccount(
        {realmAccount, governingTokenMintAccount: tokenMint, governingTokenOwner: userAccount}
      ).publicKey,
      depositAuthority: userAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      registrar: tokenRegistrarKey
    }).instruction()

    ixs.push(depositTokenIx)
  }

  const bonkVwr = await connection.getAccountInfo(bonkVwrAddress)

  if (!bonkVwr) {
    const createBonkVwrIx = await bonkClient.methods.createVoterWeightRecord(userAccount)
    .accountsPartial({
      voterWeightRecord: bonkVwrAddress,
      registrar: registrarData.publicKey,
      stakeDepositRecord: bonkSdrKey(bonkVwrAddress, bonkClient.programId)[0],
      payer: userAccount
    }).instruction()

    ixs.push(createBonkVwrIx)
  }

  const signature = await sendTransaction(
    connection,
    ixs,
    wallet,
  )

  return signature
} 
  
export default transitionTokensHandler