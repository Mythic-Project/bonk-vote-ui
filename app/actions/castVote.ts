import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { AccountMeta, Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, VoteChoice, ProposalV2, GovernanceAccount } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";
import { BonkPlugin } from "../plugin/BonkPlugin/type";
import { StakeDepositRecord, bonkSdrKey, bonkVwrKey, registrarKey } from "../plugin/BonkPlugin/utils";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";
import { DEFAULT_TOKEN_VOTER_PROGRAM_ID, tokenVwrKey } from "../plugin/TokenVoter/utils";

export async function castVoteHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
    delegateRecords: TokenOwnerRecordWithPluginData[] | null,
    proposal: ProposalV2,
    votes: number[],
    denyVote: boolean,
    defaultGovernance: GovernanceAccount,
    message?: string,
    bonkClient?: Program<BonkPlugin> | undefined
) {
    const ixs: TransactionInstruction[] = []

    if (!tokenOwnerRecord && (!delegateRecords || delegateRecords.length === 0)) {
        throw new Error("The user does not have the voting power.")
    }

    const approveVotes: VoteChoice[] = proposal.options.map((_, index) => {
        const selected = votes.includes(index)

        return {
            rank: 0,
            weightPercentage: selected ? 100 : 0
        }
    })

    let largeIx = false

    const registrar = bonkClient ? 
        registrarKey(realmAccount, tokenMint, bonkClient.programId) : 
        undefined

    if (tokenOwnerRecord) {
        let vwrKey: PublicKey | undefined = undefined
 
        if (registrar && bonkClient) {
            vwrKey = bonkVwrKey(realmAccount, tokenMint, tokenOwnerRecord.governingTokenOwner, bonkClient.programId)[0]
            const inputVoterWeight = tokenVwrKey(realmAccount, tokenMint, userAccount, DEFAULT_TOKEN_VOTER_PROGRAM_ID)[0]
            const stakeDepositRecordKey = bonkSdrKey(vwrKey, bonkClient.programId)[0]
            const stakeDepositRecord = await bonkClient.account.stakeDepositRecord.fetch(stakeDepositRecordKey)
            const sdrs = 
            filterSdr(tokenOwnerRecord, stakeDepositRecord, proposal, defaultGovernance)
            
            largeIx = sdrs.length > 10

            const sdrsChunks = largeIx ?
                [sdrs.slice(0,10), sdrs.slice(10)] :
                [sdrs]
            
            for (const sdrsChunk of sdrsChunks) {
                const updateVoterRecordIx = await bonkClient.methods.updateVoterWeightRecord(
                    sdrsChunk.length,
                    proposal.publicKey,
                    {castVote: {}}
                )
                    .accounts({
                        registrar,
                        voterWeightRecord: vwrKey,
                        inputVoterWeight,
                        governance: proposal.governance,
                        voterTokenOwnerRecord: tokenOwnerRecord.publicKey,
                        voterAuthority: userAccount,
                        proposal: proposal.publicKey,
                        payer: userAccount
                    })
                    .remainingAccounts(sdrsChunk)
                    .instruction()
                
                ixs.push(updateVoterRecordIx)
            }
        }

        const selfVoteIx = await govClient.castVoteInstruction(
            denyVote ? {deny: {}} : {approve: [approveVotes]},
            realmAccount,
            proposal.governance,
            proposal.publicKey,
            proposal.tokenOwnerRecord,
            tokenOwnerRecord.publicKey,
            userAccount,
            tokenMint,
            userAccount,
            vwrKey
        )
    
        ixs.push(selfVoteIx)
    }

    if (delegateRecords) {
        for (const record of delegateRecords) {
            let vwrKey: PublicKey | undefined = undefined

            if (registrar && bonkClient) {
                vwrKey = bonkVwrKey(realmAccount, tokenMint, record.governingTokenOwner, bonkClient.programId)[0]
                const inputVoterWeight = tokenVwrKey(realmAccount, tokenMint, record.governingTokenOwner, DEFAULT_TOKEN_VOTER_PROGRAM_ID)[0]
                const stakeDepositRecordKey = bonkSdrKey(vwrKey, bonkClient.programId)[0]
    
                const stakeDepositRecord = await bonkClient.account.stakeDepositRecord.fetch(stakeDepositRecordKey)
                const sdrs = filterSdr(record, stakeDepositRecord, proposal, defaultGovernance)
                
                const updateVoterRecordIx = await bonkClient.methods.updateVoterWeightRecord(
                    sdrs.length,
                    proposal.publicKey,
                    {castVote: {}}
                )
                    .accounts({
                        registrar,
                        voterWeightRecord: vwrKey,
                        inputVoterWeight,
                        governance: proposal.governance,
                        voterTokenOwnerRecord: record.publicKey,
                        voterAuthority: userAccount,
                        proposal: proposal.publicKey,
                        payer: userAccount
                    })
                    .remainingAccounts(sdrs)
                    .instruction()
                
                ixs.push(updateVoterRecordIx)
            }
    
            const delegateVoteIx = await govClient.castVoteInstruction(
                denyVote ? {deny: {}} : {approve: [approveVotes]},
                realmAccount,
                proposal.governance,
                proposal.publicKey,
                proposal.tokenOwnerRecord,
                record.publicKey,
                userAccount,
                tokenMint,
                userAccount,
                vwrKey
            )
    
            ixs.push(delegateVoteIx)
        }
    }

    const chatAccount = Keypair.generate()
    const chatTor = tokenOwnerRecord ? tokenOwnerRecord :
        delegateRecords![0]


    if (message) {
        let vwrKey: PublicKey | undefined = undefined

        if (registrar && bonkClient) {
            vwrKey = bonkVwrKey(realmAccount, tokenMint, chatTor.governingTokenOwner, bonkClient.programId)[0]
            const inputVoterWeight = tokenVwrKey(realmAccount, tokenMint, chatTor.governingTokenOwner, DEFAULT_TOKEN_VOTER_PROGRAM_ID)[0]
            const stakeDepositRecordKey = bonkSdrKey(vwrKey, bonkClient.programId)[0]
            const stakeDepositRecord = await bonkClient.account.stakeDepositRecord.fetch(stakeDepositRecordKey)

            const sdrs = filterSdr(chatTor, stakeDepositRecord, proposal, defaultGovernance)

            const updateVoterRecordIx = await bonkClient.methods.updateVoterWeightRecord(
                sdrs.length,
                proposal.publicKey,
                {commentProposal: {}}
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
                .remainingAccounts(sdrs)
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
        2,
        message ? chatAccount : undefined,
        undefined,
        largeIx
    )

    return signature
}


export function filterSdr(
    tokenOwnerRecord: TokenOwnerRecordWithPluginData,
    stakeDepositRecord: StakeDepositRecord,
    proposal: ProposalV2,
    defaultGovernance?: GovernanceAccount
) {
    const sdrs: AccountMeta[] = []

    if (tokenOwnerRecord.stakeDepositReceipts) {
        for (const sdr of tokenOwnerRecord.stakeDepositReceipts) {
            const isSdrAlreadyUsed = stakeDepositRecord.weightActionTarget?.equals(proposal.publicKey) &&
                stakeDepositRecord.deposits.map(k => k.toBase58()).includes(sdr.publicKey.toBase58())
                        
            if (!isSdrAlreadyUsed && proposal.votingAt) {
                const proposalEndTime = defaultGovernance ?
                    proposal.votingAt.toNumber() + 
                    defaultGovernance.config.votingBaseTime + 
                    defaultGovernance.config.votingCoolOffTime 
                :   Date.now()
                    
                const sdrEndTime = sdr.account.depositTimestamp.toNumber() + sdr.account.lockupDuration.toNumber()
                                
                if (sdrEndTime > proposalEndTime) {
                    sdrs.push({
                        pubkey: sdr.publicKey,
                        isSigner: false,
                        isWritable: false
                    })
                }
            }
        }
    }

    return sdrs
}