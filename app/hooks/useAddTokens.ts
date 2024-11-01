import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import addTokensHandler from "../actions/addTokens";
import { Governance } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetRegistrar } from "./useVsr";
import { BonkPluginClient } from "../plugin/BonkPlugin/client";
import { TokenVoterClient } from "../plugin/TokenVoter/client";

export function useAddTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["add-tokens-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {tokenAccount, amount, mint}:
            {tokenAccount: PublicKey, amount: BN, mint: PublicKey}
        ): Promise<string | null> => {

            if (!selectedRealm || !wallet.publicKey || registrar === undefined) {
                return null
            }
        
            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
            const vsrClient = registrar === null ? undefined : TokenVoterClient(connection, registrar.programId)
            const publicKey = wallet.publicKey
        
            const sig = await addTokensHandler(
                connection,
                wallet,
                govClient,
                new PublicKey(selectedRealm.realmId),
                new PublicKey(selectedRealm.tokenMint),
                mint,
                tokenAccount,
                publicKey,
                amount,
                registrar,
                vsrClient,
            )

            return "sig"
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
        }
    })
}