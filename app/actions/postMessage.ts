import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Governance, ProposalV2, TokenOwnerRecord } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";

export async function postMessageHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    userAccount: PublicKey,
    tokenOwnerRecord: TokenOwnerRecord | null,
    delegateRecords: TokenOwnerRecord[] | null,
    proposal: ProposalV2,
    tokenMint: PublicKey,
    message: string,
    messageType: "text" | "reaction",
    replyTo?: PublicKey,
    // vsrClient?: Program<VoterStakeRegistry> | undefined
) {
    // const ixs: TransactionInstruction[] = []

    // if (!tokenOwnerRecord && (!delegateRecords || delegateRecords.length === 0)) {
    //     throw new Error("The user does not have the voting power.")
    // }

    // const chatAccount = Keypair.generate()
    // const chatTor = tokenOwnerRecord ? tokenOwnerRecord :
    //     delegateRecords![0]
    
    // const vwrKey = vsrClient ? 
    //     vsrRecordKey(realmAccount, tokenMint, chatTor.governingTokenOwner, vsrClient.programId)[0] :
    //     undefined

    // if (vwrKey && vsrClient) {
    //     const registrar = vsrClient ? registrarKey(realmAccount, tokenMint, vsrClient.programId) : undefined
    //     const [voterKey] = voterRecordKey(realmAccount, tokenMint, chatTor.governingTokenOwner, vsrClient.programId)

    //     const updateVoterRecordIx = await vsrClient.methods.updateVoterWeightRecord()
    //         .accounts({
    //             registrar,
    //             voter: voterKey,
    //             voterWeightRecord: vwrKey
    //         }).instruction()
        
    //     ixs.push(updateVoterRecordIx)
    // }
    // const chatMessageIx = await govClient.postMessageInstruction(
    //     message,
    //     messageType,
    //     replyTo !== undefined,
    //     chatAccount.publicKey,
    //     realmAccount,
    //     proposal.governance,
    //     proposal.publicKey,
    //     chatTor.publicKey,
    //     userAccount,
    //     userAccount,
    //     replyTo,
    //     vwrKey
    // )
    
    // ixs.push(chatMessageIx)

    // const signature = await sendTransaction(
    //     connection,
    //     ixs,
    //     wallet,
    //     undefined,
    //     chatAccount
    // )
    
    // return signature
}