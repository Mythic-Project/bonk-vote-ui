import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { walletNameToAddressAndProfilePicture } from "@portal-payments/solana-wallet-names";

import delegateTokensHanlder from "../actions/delegateTokens";

export function useDelegateTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["delegate-tokens-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {
                newDelegate,
                addDelegateTx,
                tokenOwnerRecord, 
            }:
            {
                newDelegate: string | null, 
                addDelegateTx: boolean,
                tokenOwnerRecord: TokenOwnerRecord, 
            }
        ): Promise<string | null> => {

            if (!selectedRealm || !wallet.publicKey) {
                throw new Error("Withdrawal failed! Try again.")
            }

            let delegateKey: PublicKey | null = null

            if (addDelegateTx && newDelegate) {
                try {
                    delegateKey = new PublicKey(newDelegate)
                } catch {
                    const walletDetails = await walletNameToAddressAndProfilePicture(connection, newDelegate)       
                    try {
                        delegateKey = new PublicKey(walletDetails.walletAddress)
                    } catch {
                        throw new Error("Invalid Address.")
                    }
                }
            }

            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))

            const sig = await delegateTokensHanlder(
                connection,
                govClient,
                tokenOwnerRecord,
                delegateKey,
                wallet
            )

            return sig
        },
        onSuccess: async() => {
            client.resetQueries({
                queryKey: ['get-token-record', {name, tokenOwner: wallet.publicKey}]
            })
            
            await client.invalidateQueries({
                queryKey: ['get-token-record', {name, tokenOwner: wallet.publicKey}]
            })

            await client.invalidateQueries({
                queryKey: ['get-voter-weight', {name, tokenOwner: wallet.publicKey}]
            })
        }
    })
}