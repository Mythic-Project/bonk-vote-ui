import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetRegistrar } from "./useVsr";
import { VoteRecordWithGov } from "./useVoteRecord";
import { claimSolHandler } from "../actions/claimSol";
import { BonkPluginClient } from "../plugin/BonkPlugin/client";

export function useClaimSol(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["claim-sol-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {
                tokenOwnerRecord, 
                voteRecords,
            }:
            {
                tokenOwnerRecord: TokenOwnerRecord, 
                voteRecords: VoteRecordWithGov[],
            }
        ) => {

            if (!selectedRealm || !wallet.publicKey || registrar === undefined) {
                throw new Error("Withdrawal failed! Try again.")
            }

            const vsrClient = registrar === null ? undefined : BonkPluginClient(connection, registrar.programId)
            const publicKey = wallet.publicKey

            const sig = await claimSolHandler(
                connection,
                wallet,
                new PublicKey(selectedRealm.realmId),
                new PublicKey(selectedRealm.tokenMint),
                publicKey,
                tokenOwnerRecord,
                voteRecords,
                // registrar,
                // vsrClient
            )

            // return sig
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