import { Governance } from "test-governance-sdk";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

async function withdrawWrongDepositHandler(
  connection: Connection,
  wallet: WalletContextState,
  ixClient: Governance,
  realmAccount: PublicKey,
  tokenMint: PublicKey,
  userAccount: PublicKey,
  voteRecords: VoteRecordWithGov[],
  tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
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
  }
 
  
  const signature = await sendTransaction(
    connection,
    ixs,
    wallet
  )

  return signature
} 
  
export default withdrawWrongDepositHandler