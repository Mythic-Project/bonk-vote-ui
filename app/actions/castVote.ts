import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, VoteChoice, ProposalV2, TokenOwnerRecord } from "test-governance-sdk";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import sendTransaction from "../utils/send-transaction";
import BN from "bn.js"
import { registrarKey, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";

export async function castVoteHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecord | null,
    delegateRecords: TokenOwnerRecord[] | null,
    proposal: ProposalV2,
    votes: number[],
    denyVote: boolean,
    message?: string,
    vsrClient?: Program<VoterStakeRegistry> | undefined
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

    const registrar = vsrClient ? registrarKey(realmAccount, tokenMint, vsrClient.programId) : undefined

    if (tokenOwnerRecord) {
        let vwrKey: PublicKey | undefined = undefined
        if (registrar && vsrClient) {
            const [voterKey] = voterRecordKey(realmAccount, tokenMint, tokenOwnerRecord.governingTokenOwner, vsrClient.programId)
            vwrKey = vsrRecordKey(realmAccount, tokenMint, tokenOwnerRecord.governingTokenOwner, vsrClient.programId)[0]

            const updateVoterRecordIx = await vsrClient.methods.updateVoterWeightRecord()
                .accounts({
                    registrar,
                    voter: voterKey,
                    voterWeightRecord: vwrKey
                }).instruction()
            
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

            if (registrar && vsrClient) {
                const [voterKey] = voterRecordKey(realmAccount, tokenMint, record.governingTokenOwner, vsrClient.programId)
                vwrKey = vsrRecordKey(realmAccount, tokenMint, record.governingTokenOwner, vsrClient.programId)[0]
    
                const updateVoterRecordIx = await vsrClient.methods.updateVoterWeightRecord()
                    .accounts({
                        registrar,
                        voter: voterKey,
                        voterWeightRecord: vwrKey
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
        const vwrKey = vsrClient ? 
            vsrRecordKey(realmAccount, tokenMint, chatTor.governingTokenOwner, vsrClient.programId)[0] :
            undefined

        if (vwrKey && vsrClient) {
            const [voterKey] = voterRecordKey(realmAccount, tokenMint, chatTor.governingTokenOwner, vsrClient.programId)

            const updateVoterRecordIx = await vsrClient.methods.updateVoterWeightRecord()
            .accounts({
                registrar,
                voter: voterKey,
                voterWeightRecord: vwrKey
            }).instruction()
        
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