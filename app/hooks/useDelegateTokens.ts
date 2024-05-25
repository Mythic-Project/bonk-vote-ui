import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
                tokenOwnerRecord, 
            }:
            {
                newDelegate: PublicKey | null, 
                tokenOwnerRecord: TokenOwnerRecord, 
            }
        ): Promise<string | null> => {

            if (!selectedRealm || !wallet.publicKey) {
                throw new Error("Withdrawal failed! Try again.")
            }

            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))

            const sig = await delegateTokensHanlder(
                connection,
                govClient,
                tokenOwnerRecord,
                newDelegate,
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