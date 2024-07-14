import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { AccountMeta, Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { TokenOwnerRecord } from "test-governance-sdk";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import { Registrar, voterRecordKey } from "../plugin/VoterStakeRegistry/utils";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import sendTransaction from "../utils/send-transaction";

export async function claimSolHandler(
    connection: Connection,
    wallet: WalletContextState,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecord,
    voteRecords: VoteRecordWithGov[],
    registrar: Registrar | null,
    vsrClient?: Program<VoterStakeRegistry> | undefined,
) {
  const ixs: TransactionInstruction[] = []

  if (tokenOwnerRecord.outstandingProposalCount > 0) {
    throw new Error("The user has the outstanding proposals. Can't withdraw the tokens.")
  }

  if (voteRecords.length) {
    throw new Error("Withdraw your tokens before claiming SOL.")
  }

  if (registrar && vsrClient) {
    const [voterKey] = voterRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
    
    const deposits = (await vsrClient.account.voter.fetch(voterKey)).deposits
      
    for (const deposit of deposits) {
      if (deposit.amountDepositedNative.gt(new BN(0))) {
        throw new Error("Withdraw your tokens before claiming SOL.")
      }
    }

    const tokenAccounts: AccountMeta[] = []

    for (const votingMint of registrar.data.votingMints) {
      if (!votingMint.mint.equals(SystemProgram.programId)) {
        const voterAtaKey = anchor.utils.token.associatedAddress({mint: votingMint.mint, owner: voterKey})
        const voterAta = await connection.getAccountInfo(voterAtaKey)

        if (voterAta) {
          tokenAccounts.push({
            pubkey: voterAtaKey,
            isWritable: true,
            isSigner: false
          })
        }
      }
    }

    const claimIx = await vsrClient.methods.closeVoter()
      .accounts({
        registrar: registrar.publicKey,
        voter: voterKey,
        voterAuthority: userAccount,
        solDestination: userAccount
      })
      .remainingAccounts(tokenAccounts)
      .instruction()
    
    ixs.push(claimIx)
  }

  return await sendTransaction(
    connection,
    ixs,
    wallet,
    10
  )
}