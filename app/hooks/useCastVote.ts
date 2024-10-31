import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, ProposalV2 } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { castVoteHandler } from "../actions/castVote";
import { relinquishVotesHandler } from "../actions/relinquishVote";
import { useGetRegistrar } from "./useVsr";
import { BonkPluginClient } from "../plugin/BonkPlugin/client";
import { TokenOwnerRecordWithPluginData } from "./useVoterRecord";

export function useCastVote(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
        mutationKey: ["cast-vote-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {proposal, votes, denyVote, message, tokenOwnerRecord, delegateRecords, removeVotes} :
            {
                proposal: ProposalV2,
                votes: number[],
                denyVote: boolean,
                tokenOwnerRecord: TokenOwnerRecordWithPluginData | null | undefined,
                delegateRecords: TokenOwnerRecordWithPluginData[] | null | undefined,
                removeVotes: boolean, // Passed if wants to remove votes
                message?: string,
            }
        ) => {

            if (!selectedRealm || !wallet.publicKey || tokenOwnerRecord === undefined || 
                delegateRecords === undefined || registrar === undefined
            ) {
                return null
            }
        
            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
            const bonkClient = registrar === null ? undefined : BonkPluginClient(connection, registrar.programId)

            const realm = new PublicKey(selectedRealm.realmId)
            const tokenMint = new PublicKey(selectedRealm.tokenMint)

            const result = removeVotes ?
                await relinquishVotesHandler(
                    connection,
                    wallet,
                    govClient,
                    realm,
                    tokenMint,
                    wallet.publicKey,
                    tokenOwnerRecord,
                    delegateRecords,
                    proposal,
                    message,
                    bonkClient
                ) :
                await castVoteHandler(
                    connection,
                    wallet,
                    govClient,
                    realm,
                    tokenMint,
                    wallet.publicKey,
                    tokenOwnerRecord,
                    delegateRecords,
                    proposal,
                    votes,
                    denyVote,
                    message,
                    bonkClient
                )

            return result
        },
        onSuccess: async(_, {proposal, tokenOwnerRecord}) => {
            await client.resetQueries({
                queryKey: ['get-proposal', {
                    name,
                    proposal: proposal.publicKey,
                }]
            })     
            
            // Invalidate Self + Delegate Vote Records for the particular proposal
            await client.invalidateQueries({
                queryKey: ['get-vote-records', {
                    name,
                    proposal: proposal.publicKey,
                    voter: wallet.publicKey
                }]
            })

            if (tokenOwnerRecord) {
                // Invalidate all Self Vote Records (for Withdraw Button)
                await client.invalidateQueries({
                    queryKey: ['get-vote-records', {
                        name,
                        voter: wallet.publicKey
                    }],
                })
            }

            await client.invalidateQueries({
                queryKey: ['get-comments', {name, proposal: proposal.publicKey}]
            })
        }
    })
}