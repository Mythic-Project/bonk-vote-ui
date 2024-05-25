import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import addTokensHandler from "../actions/addTokens";
import { Governance } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VsrClient } from "../plugin/VoterStakeRegistry/client";
import { useGetRegistrar } from "./useVsr";

export function useAddTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["add-tokens-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {tokenAccount, amount}:
            {tokenAccount: PublicKey, amount: BN}
        ): Promise<string | null> => {

            if (!selectedRealm || !wallet.publicKey || registrar === undefined) {
                return null
            }
        
            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
            const vsrClient = registrar === null ? undefined : VsrClient(connection, registrar.programId)
            const publicKey = wallet.publicKey
        
            const sig = await addTokensHandler(
                connection,
                wallet,
                govClient,
                new PublicKey(selectedRealm.realmId),
                new PublicKey(selectedRealm.tokenMint),
                tokenAccount,
                publicKey,
                amount,
                vsrClient
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
                queryKey: [
                    'get-tokens-holding', {name, publicKey: wallet.publicKey}]
            })
            await client.invalidateQueries({
                queryKey: ['get-voter-weight', {name, tokenOwner: wallet.publicKey}]
            })
        }
    })
}