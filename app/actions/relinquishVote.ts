import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, ProposalV2, TokenOwnerRecord, VoteRecord } from "test-governance-sdk";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import sendTransaction from "../utils/send-transaction";
import BN from "bn.js"
import { registrarKey, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";

export async function relinquishVotesHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecord | null,
    delegateRecords: TokenOwnerRecord[] | null,
    proposal: ProposalV2,
    message?: string,
    vsrClient?: Program<VoterStakeRegistry> | undefined
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
        const vwrKey = vsrClient ? 
            vsrRecordKey(realmAccount, tokenMint, chatTor.governingTokenOwner, vsrClient.programId)[0] :
            undefined

        if (vwrKey && vsrClient) {
            const registrar = vsrClient ? registrarKey(realmAccount, tokenMint, vsrClient.programId) : undefined
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
        ixs.length%2 === 0 ? 8 : 7,
        message ? chatAccount : undefined
    )

    return signature
}