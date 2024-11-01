import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, ProposalV2, TokenOwnerRecord } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";
import { BonkPlugin } from "../plugin/BonkPlugin/type";
import { bonkSdrKey, bonkVwrKey, registrarKey } from "../plugin/BonkPlugin/utils";
import { DEFAULT_TOKEN_VOTER_PROGRAM_ID, tokenVwrKey } from "../plugin/TokenVoter/utils";
import { filterSdr } from "./castVote";
import { TokenOwnerRecordWithPluginData } from "../hooks/useVoterRecord";

export async function postMessageHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecordWithPluginData | null,
    delegateRecords: TokenOwnerRecordWithPluginData[] | null,
    proposal: ProposalV2,
    tokenMint: PublicKey,
    message: string,
    messageType: "text" | "reaction",
    replyTo?: PublicKey,
    bonkClient?: Program<BonkPlugin> | undefined
) {
    const ixs: TransactionInstruction[] = []

    const chatAccount = Keypair.generate()
    const chatTor = tokenOwnerRecord ? tokenOwnerRecord :
        delegateRecords![0]

    let vwrKey: PublicKey | undefined = undefined

    if (bonkClient) {
        vwrKey = bonkVwrKey(realmAccount, tokenMint, chatTor.governingTokenOwner, bonkClient.programId)[0]
        const inputVoterWeight = tokenVwrKey(realmAccount, tokenMint, userAccount, DEFAULT_TOKEN_VOTER_PROGRAM_ID)[0]
        const registrar = registrarKey(realmAccount, tokenMint, bonkClient.programId)
        const stakeDepositRecordKey = bonkSdrKey(vwrKey, bonkClient.programId)[0]
        const stakeDepositRecord = await bonkClient.account.stakeDepositRecord.fetch(stakeDepositRecordKey)

        const sdrs = filterSdr(chatTor, stakeDepositRecord, proposal)

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
        messageType,
        replyTo !== undefined,
        chatAccount.publicKey,
        realmAccount,
        proposal.governance,
        proposal.publicKey,
        chatTor.publicKey,
        userAccount,
        userAccount,
        replyTo,
        vwrKey
    )
    
    ixs.push(chatMessageIx)

    const signature = await sendTransaction(
        connection,
        ixs,
        wallet,
        undefined,
        chatAccount
    )
    
    return signature
}