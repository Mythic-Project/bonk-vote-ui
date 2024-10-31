import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, VoteChoice, ProposalV2 } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";
import BN from "bn.js"
import { BonkPlugin } from "../plugin/BonkPlugin/type";
import { bonkSdrKey, bonkVwrKey, registrarKey } from "../plugin/BonkPlugin/utils";
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

            let sdrs = tokenOwnerRecord.stakeDepositReceipts?.map(sdr => (
                {
                    pubkey: sdr.publicKey,
                    isSigner: false,
                    isWritable: false
                }
            ))
            
            if (stakeDepositRecord.weightActionTarget?.equals(proposal.publicKey)) {
                sdrs = sdrs?.filter(s => {
                    return stakeDepositRecord.deposits.map(k => k.toBase58()).includes(s.pubkey.toBase58())
                })
            }
            
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
                    voterTokenOwnerRecord: tokenOwnerRecord.publicKey,
                    voterAuthority: userAccount,
                    proposal: proposal.publicKey,
                    payer: userAccount
                })
                .remainingAccounts(sdrs ?? [])
                .instruction()

            console.log(updateVoterRecordIx.keys.map(k => ({...k, pubkey: k.pubkey.toBase58()})))
            
            ixs.push(updateVoterRecordIx)
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
    
                let sdrs = record.stakeDepositReceipts?.map(sdr => (
                    {
                        pubkey: sdr.publicKey,
                        isSigner: false,
                        isWritable: false
                    }
                ))
    

                if (stakeDepositRecord.weightActionTarget?.equals(proposal.publicKey)) {
                    sdrs = sdrs?.filter(s => {
                        return !stakeDepositRecord.deposits.map(k => k.toBase58()).includes(s.pubkey.toBase58())
                    })
                }

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
                        voterTokenOwnerRecord: record.publicKey,
                        voterAuthority: userAccount,
                        proposal: proposal.publicKey,
                        payer: userAccount
                    }).instruction()
                
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

            let sdrs = chatTor.stakeDepositReceipts?.map(sdr => (
                {
                    pubkey: sdr.publicKey,
                    isSigner: false,
                    isWritable: false
                }
            ))

            if (stakeDepositRecord.weightActionTarget?.equals(proposal.publicKey)) {
                sdrs = sdrs?.filter(s => {
                    return !stakeDepositRecord.deposits.map(k => k.toBase58()).includes(s.pubkey.toBase58())
                })
            }

            console.log(sdrs)

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
        6,
        message ? chatAccount : undefined
    )

    return signature
}