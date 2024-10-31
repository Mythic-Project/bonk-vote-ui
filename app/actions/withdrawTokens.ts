import { Program } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import * as anchor from "@coral-xyz/anchor";
import { VoteRecordWithGov } from "../hooks/useVoteRecord";
import * as token from "@solana/spl-token";
import sendTransaction from "../utils/send-transaction";
import { Registrar } from "../plugin/BonkPlugin/utils";
import { TokenVoter } from "../plugin/TokenVoter/type";
import { registrarKey, tokenVoterKey, tokenVwrKey } from "../plugin/TokenVoter/utils";

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
    registrar: Registrar | null,
    tokenVoterClient?: Program<TokenVoter> | undefined,
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

    if (registrar && tokenVoterClient) {
        const tokenRegistrarKey = registrarKey(realmAccount, tokenMint, tokenVoterClient.programId)
        const [voterKey] = tokenVoterKey(realmAccount, tokenMint, userAccount, tokenVoterClient.programId)
        const [tokenVwr] = tokenVwrKey(realmAccount, tokenMint, userAccount, tokenVoterClient.programId)

        const withdawIx = await tokenVoterClient.methods.withdraw(
            0, 
            amount
        ).accountsPartial({
            registrar: tokenRegistrarKey,
            voter: voterKey,
            voterAuthority: userAccount,
            tokenOwnerRecord: tokenOwnerRecord.publicKey,
            mint: tokenMint,
            voterWeightRecord: tokenVwr,
            tokenProgram: token.TOKEN_PROGRAM_ID
        })
        .instruction()

        ixs.push(withdawIx)
    } else {
        // const vanillaWitdrawIx = await govClient.withdrawGoverningTokensInstruction(
        //     realmAccount,
        //     tokenMint,
        //     userAta,
        //     userAccount
        // )

        // ixs.push(vanillaWitdrawIx)
        // const remainingBalance = voterWeight.selfAmount.tokens[0].amount.sub(amount)

        // if (remainingBalance.gt(new BN(0))) {
        //     const vanillaDepositIx = await govClient.depositGoverningTokensInstruction(
        //         realmAccount,
        //         tokenMint,
        //         userAta,
        //         userAccount,
        //         userAccount,
        //         userAccount,
        //         remainingBalance
        //     )

        //     ixs.push(vanillaDepositIx)
        // }
    }

    return await sendTransaction(
        connection,
        ixs,
        wallet,
        10
    )
}