import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import { registrarKey, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import { VoterWeightType } from "../hooks/useVoterWeight";
import * as token from "@solana/spl-token";
import sendTransaction from "../utils/send-transaction";

export async function withdrawTokensHandler(
    connection: Connection,
    wallet: WalletContextState,
    govClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    userAccount: PublicKey,
    amount: BN,
    tokenOwnerRecord: TokenOwnerRecord,
    voteRecords: VoteRecordWithGov[],
    voterWeight: VoterWeightType,
    vsrClient?: Program<VoterStakeRegistry> | undefined
) {
    const ixs: TransactionInstruction[] = []

    if (tokenOwnerRecord.outstandingProposalCount > 0) {
        throw new Error("The user has the outstanding proposals. Can't withdraw the tokens.")
    }

    voteRecords.forEach(async(voteRecord) => {
        const relinquishIx = await govClient.relinquishVoteInstruction(
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

    const registrar = vsrClient ? 
        registrarKey(realmAccount, tokenMint, vsrClient.programId) : 
        undefined

    const userAta = anchor.utils.token.associatedAddress({mint: tokenMint, owner: userAccount})
    const doesUserAtaExist = await connection.getAccountInfo(userAta)

    if (!doesUserAtaExist) {
        const createAtaIx = token.createAssociatedTokenAccountInstruction(
            userAccount,
            userAta,
            userAccount,
            tokenMint
        )

        ixs.push(createAtaIx)
    }

    if (registrar && vsrClient) {
        const [voterKey] = voterRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
        const [vwrKey] = vsrRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
        const voterAta = anchor.utils.token.associatedAddress({mint: tokenMint, owner: voterKey})

        voterWeight.selfAmount.entryIdx.forEach(async(idx, i) => {
            const withdawIx = await vsrClient.methods.withdraw(
                idx, 
                amount // This amount can be greater than Entry balance TODO.
            ).accounts({
                registrar,
                voter: voterKey,
                voterAuthority: userAccount,
                tokenOwnerRecord: tokenOwnerRecord.publicKey,
                voterWeightRecord: vwrKey,
                vault: voterAta,
                destination: userAta
            })
            .instruction()

            ixs.push(withdawIx)
        })
    } else {
        const vanillaWitdrawIx = await govClient.withdrawGoverningTokensInstruction(
            realmAccount,
            tokenMint,
            userAta,
            userAccount
        )

        ixs.push(vanillaWitdrawIx)
        const remainingBalance = voterWeight.selfAmount.tokens.sub(amount)

        if (remainingBalance.gt(new BN(0))) {
            const vanillaDepositIx = await govClient.depositGoverningTokensInstruction(
                realmAccount,
                tokenMint,
                userAta,
                userAccount,
                userAccount,
                userAccount,
                remainingBalance
            )

            ixs.push(vanillaDepositIx)
        }
    }

    return await sendTransaction(
        connection,
        ixs,
        wallet,
        10
    )
}