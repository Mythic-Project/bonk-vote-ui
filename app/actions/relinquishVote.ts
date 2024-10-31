import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, ProposalV2 } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";
import BN from "bn.js"
import { bonkVwrKey, registrarKey } from "../plugin/BonkPlugin/utils";
import { BonkPlugin } from "../plugin/BonkPlugin/type";
import { DEFAULT_TOKEN_VOTER_PROGRAM_ID, tokenVwrKey } from "../plugin/TokenVoter/utils";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";

export async function relinquishVotesHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
    delegateRecords: TokenOwnerRecordWithPluginData[] | null,
    proposal: ProposalV2,
    message?: string,
    bonkClient?: Program<BonkPlugin> | undefined
) {
    const ixs: TransactionInstruction[] = []
    let weight = new BN(0)

    if (tokenOwnerRecord) {
        const relinquishIx = await govClient.relinquishVoteInstruction(
            realmAccount,
            proposal.governance,
            proposal.publicKey,
            tokenOwnerRecord.publicKey,
            tokenMint,
            userAccount,
            userAccount
        )

        ixs.push(relinquishIx)
    }

    if (delegateRecords) {
        for (const record of delegateRecords) {
            const relinquishIx = await govClient.relinquishVoteInstruction(
                realmAccount,
                proposal.governance,
                proposal.publicKey,
                record.publicKey,
                tokenMint,
                userAccount,
                userAccount
            )
    
            ixs.push(relinquishIx)
        }
    }

    const chatAccount = Keypair.generate()
    const chatTor = tokenOwnerRecord ? tokenOwnerRecord :
        delegateRecords![0]

    if (message) {
        let vwrKey: PublicKey | undefined = undefined

        if (bonkClient) {
            vwrKey = bonkVwrKey(realmAccount, tokenMint, chatTor.governingTokenOwner, bonkClient.programId)[0]
            const inputVoterWeight = tokenVwrKey(realmAccount, tokenMint, userAccount, DEFAULT_TOKEN_VOTER_PROGRAM_ID)[0]
            const registrar = registrarKey(realmAccount, tokenMint, bonkClient.programId)

            const sdrs = chatTor.stakeDepositReceipts?.map(sdr => (
                {
                    pubkey: sdr.publicKey,
                    isSigner: false,
                    isWritable: false
                }
            ))

            const updateVoterRecordIx = await bonkClient.methods.updateVoterWeightRecord(
                sdrs?.length ?? 0,
                proposal.publicKey,
                {castVote: {}}
            )
                .accounts({
                    registrar,
                    voterWeightRecord: vwrKey,
                    inputVoterWeight,
                    governance: proposal.governance,
                    voterTokenOwnerRecord: chatTor.publicKey,
                    voterAuthority: userAccount,
                    proposal: proposal.publicKey,
                    payer: userAccount
                })
                .remainingAccounts(sdrs ?? [])
                .instruction()
            
            ixs.push(updateVoterRecordIx)
        }
        
        const chatMessageIx = await govClient.postMessageInstruction(
            message,
            "text",
            false,
            chatAccount.publicKey,
            realmAccount,
            proposal.governance,
            proposal.publicKey,
            chatTor.publicKey,
            userAccount,
            userAccount,
            undefined,
            vwrKey
        )
        
        ixs.push(chatMessageIx)
    }

    const signature = await sendTransaction(
        connection,
        ixs,
        wallet,
        ixs.length%2 === 0 ? 8 : 7,
        message ? chatAccount : undefined
    )

    return signature
}