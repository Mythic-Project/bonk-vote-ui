import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VsrClient } from "../plugin/VoterStakeRegistry/client";
import { useGetRegistrar } from "./useVsr";
import { withdrawTokensHandler } from "../actions/withdrawTokens";
import { VoteRecordWithGov } from "./useVoteRecord";
import { VoterWeightType } from "./useVoterWeight";

export function useWithdrawTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["withdraw-tokens-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {
                amount, 
                tokenOwnerRecord, 
                voteRecords,
                voterWeight,
                depositMint
            }:
            {
                amount: BN, 
                tokenOwnerRecord: TokenOwnerRecord, 
                voteRecords: VoteRecordWithGov[],
                voterWeight: VoterWeightType,
                depositMint: PublicKey
            }
        ): Promise<string | null> => {

            if (!selectedRealm || !wallet.publicKey || registrar === undefined) {
                throw new Error("Withdrawal failed! Try again.")
            }

            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
            const vsrClient = registrar === null ? undefined : VsrClient(connection, registrar.programId)
            const publicKey = wallet.publicKey

            const sig = await withdrawTokensHandler(
                connection,
                wallet,
                govClient,
                new PublicKey(selectedRealm.realmId),
                new PublicKey(selectedRealm.tokenMint),
                depositMint,
                publicKey,
                amount,
                tokenOwnerRecord,
                voteRecords,
                voterWeight,
                registrar,
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
                queryKey: ['get-voter-weight', {name, tokenOwner: wallet.publicKey}]
            })
            await client.invalidateQueries({
                queryKey: [
                    'get-tokens-holding', {name, publicKey: wallet.publicKey}]
            })
        }
    })
}