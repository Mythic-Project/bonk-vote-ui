import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import { Registrar, registrarKey, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";
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
    depositMint: PublicKey,
    userAccount: PublicKey,
    amount: BN,
    tokenOwnerRecord: TokenOwnerRecord,
    voteRecords: VoteRecordWithGov[],
    voterWeight: VoterWeightType,
    registrar: Registrar | null,
    vsrClient?: Program<VoterStakeRegistry> | undefined,
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
            depositMint,
            userAccount,
            userAccount
        )

        ixs.push(relinquishIx)
    })

    const userAta = anchor.utils.token.associatedAddress({mint: depositMint, owner: userAccount})
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
        const voterAta = anchor.utils.token.associatedAddress({mint: depositMint, owner: voterKey})
        const deposits = (await vsrClient.account.voter.fetch(voterKey)).deposits

        let amountRemaining = amount
        let currentIndex = 0

        while(amountRemaining.gt(new BN(0))) {
            const currentDepositAmt = deposits[currentIndex].amountDepositedNative

            if (
                deposits[currentIndex].isUsed && 
                registrar.data.votingMints[deposits[currentIndex].votingMintConfigIdx].mint.equals(depositMint) &&
                currentDepositAmt.gt(new BN(0)) &&
                deposits[currentIndex].lockup.kind.none !== undefined
            ) {
                const amtToWithdraw = amount.gt(currentDepositAmt) ? currentDepositAmt : amount

                const withdawIx = await vsrClient.methods.withdraw(
                    currentIndex, 
                    amtToWithdraw
                ).accounts({
                    registrar: registrar.publicKey,
                    voter: voterKey,
                    voterAuthority: userAccount,
                    tokenOwnerRecord: tokenOwnerRecord.publicKey,
                    voterWeightRecord: vwrKey,
                    vault: voterAta,
                    destination: userAta
                })
                .instruction()
    
                ixs.push(withdawIx)
                amountRemaining = amountRemaining.sub(amtToWithdraw)
            }

            currentIndex++
        }
    } else {
        const vanillaWitdrawIx = await govClient.withdrawGoverningTokensInstruction(
            realmAccount,
            tokenMint,
            userAta,
            userAccount
        )

        ixs.push(vanillaWitdrawIx)
        const remainingBalance = voterWeight.selfAmount.tokens[0].amount.sub(amount)

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