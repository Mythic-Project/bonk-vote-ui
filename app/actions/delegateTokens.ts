import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import sendTransaction from "../utils/send-transaction";

async function delegateTokensHanlder(
    connection: Connection,
    govClient: Governance,
    tokenOwnerRecord: TokenOwnerRecord,
    newDelegate: PublicKey | null,
    wallet: WalletContextState
) {
    if (!wallet.publicKey) {
        throw new Error("The wallet is not connected.")
    }

    const delegateIx = await govClient.setGovernanceDelegateInstruction(
        tokenOwnerRecord.publicKey,
        wallet.publicKey,
        newDelegate
    )

    return await sendTransaction(
        connection,
        [delegateIx],
        wallet
    )
}

export default delegateTokensHanlder