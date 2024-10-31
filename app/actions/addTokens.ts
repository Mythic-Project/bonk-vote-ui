import { Governance } from "test-governance-sdk";
import { Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import sendTransaction from "../utils/send-transaction";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Registrar } from "../plugin/BonkPlugin/utils";
import { TokenVoter } from "../plugin/TokenVoter/type";
import { registrarKey, tokenVoterKey, tokenVwrKey } from "../plugin/TokenVoter/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
    tokenVoterClient?: Program<TokenVoter> | undefined
) {
    const ixs: TransactionInstruction[] = []

    // VSR Deposit
    if (registrarData && tokenVoterClient) {
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

        const tokenRegistrarKey = registrarKey(realmAccount, tokenMint, tokenVoterClient.programId)
        const [voterKey] = tokenVoterKey(realmAccount, tokenMint, userAccount, tokenVoterClient.programId)
        const [tokenVwr] = tokenVwrKey(realmAccount, tokenMint, userAccount, tokenVoterClient.programId)

        try {
            const voterAccount = await tokenVoterClient.account.voter.fetch(voterKey)
        } catch {
            const createVoterIx = await tokenVoterClient.methods.createVoterWeightRecord()
            .accountsPartial({
                registrar: tokenRegistrarKey,
                voter: voterKey,
                voterWeightRecord: tokenVwr,
                voterAuthority: userAccount
            }).instruction()
        
            ixs.push(createVoterIx)
        }

        let depositEntryIndex = 0

        const depositIx = await tokenVoterClient.methods.deposit(
                depositEntryIndex, 
                amount
            ).accountsPartial({
                mint: tokenMint,
                tokenOwnerRecord: tokenOwnerRecordKey,
                depositAuthority: wallet.publicKey ?? undefined,
                tokenProgram: TOKEN_PROGRAM_ID,
                registrar: tokenRegistrarKey
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