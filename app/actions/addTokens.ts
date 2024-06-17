import { Governance } from "test-governance-sdk";
import { Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { DepositEntry, Registrar, voterRecordKey, vsrRecordKey } from "../plugin/VoterStakeRegistry/utils";
import { Program } from "@coral-xyz/anchor";
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl";
import * as anchor from "@coral-xyz/anchor";

async function addTokensHandler(
    connection: Connection,
    wallet: WalletContextState,
    ixClient: Governance,
    realmAccount: PublicKey,
    tokenMint: PublicKey,
    depositMint: PublicKey,
    tokenAccount: PublicKey,
    userAccount: PublicKey,
    amount: BN,
    registrarData: Registrar | null,
    vsrClient?: Program<VoterStakeRegistry> | undefined
) {
    const ixs: TransactionInstruction[] = []

    // VSR Deposit
    if (registrarData && vsrClient) {
        const tokenOwnerRecordKey = ixClient.pda.tokenOwnerRecordAccount({
            realmAccount, governingTokenMintAccount: tokenMint, governingTokenOwner: userAccount
        }).publicKey

        const tokenOwnerRecord = await connection.getAccountInfo(tokenOwnerRecordKey)

        if (!tokenOwnerRecord) {
            const createTokenOwnerRecordIx = await ixClient.createTokenOwnerRecordInstruction(
                realmAccount, userAccount, tokenMint, userAccount
            )
            ixs.push(createTokenOwnerRecordIx)
        }

        const [voterKey, voterBump] = voterRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
        const [vwrKey, vwrBump] = vsrRecordKey(realmAccount, tokenMint, userAccount, vsrClient.programId)
        const voterAta = anchor.utils.token.associatedAddress({mint: depositMint, owner: voterKey})

        let deposits: DepositEntry[] = []

        try {
            const voterAccount = await vsrClient.account.voter.fetch(voterKey)
            deposits.push(...voterAccount.deposits)
        } catch {
            const createVoterIx = await vsrClient.methods.createVoter(voterBump, vwrBump)
            .accounts({
                registrar: registrarData.publicKey,
                voter: voterKey,
                voterAuthority: userAccount,
                voterWeightRecord: vwrKey,
                instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
                payer: userAccount
            }).instruction()
        
            ixs.push(createVoterIx)
        }

        let depositEntryIndex = 0

        let availableDeposit = deposits.findIndex(
            deposit => deposit.isUsed && deposit.lockup.kind.none && 
                registrarData.data.votingMints[deposit.votingMintConfigIdx].mint.equals(depositMint)
        )

        if (availableDeposit === -1) {
            availableDeposit = deposits.findIndex(deposit => !deposit.isUsed)

            if (availableDeposit === -1 && deposits.length > 0) {
                throw new Error("No deposit entry space is available.")
            }

            availableDeposit = availableDeposit === -1 ? 0 : availableDeposit
            depositEntryIndex = availableDeposit

            const createDepositEntryIx = await vsrClient.methods.createDepositEntry(
                    availableDeposit,
                    {none: {}},
                    null,
                    0,
                    false
                ).accounts({
                    registrar: registrarData.publicKey,
                    voter: voterKey,
                    voterAuthority: userAccount,
                    depositMint,
                    vault: voterAta,
                    payer: userAccount
                }).instruction()

            ixs.push(createDepositEntryIx)
        } else {
            depositEntryIndex = availableDeposit
        }

        const depositIx = await vsrClient.methods.deposit(
                depositEntryIndex, 
                amount
            ).accounts({
                registrar: registrarData.publicKey,
                voter: voterKey,
                vault: voterAta,
                depositToken: tokenAccount,
                depositAuthority: userAccount
            }).instruction()
        
        ixs.push(depositIx)
    } else {
        const vanillaDepositIx = await ixClient.depositGoverningTokensInstruction(
            realmAccount,
            tokenMint,
            tokenAccount,
            userAccount,
            userAccount,
            userAccount,
            amount
        )

        ixs.push(vanillaDepositIx)
    }

    return await sendTransaction(connection, ixs, wallet)
}

export default addTokensHandler