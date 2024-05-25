import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, ProposalV2, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postMessageHandler } from "../actions/postMessage";
import { useGetRegistrar } from "./useVsr";
import { VsrClient } from "../plugin/VoterStakeRegistry/client";

export function usePostMessage(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data

    const client = useQueryClient()

    return useMutation({
        mutationKey: ["post-message-mutation", {name, publicKey: wallet.publicKey}],
        mutationFn: async(
            {proposal, message, tokenOwnerRecord, delegateRecords, messageType, replyTo} :
            {
                proposal: ProposalV2,
                tokenOwnerRecord: TokenOwnerRecord | null | undefined,
                delegateRecords: TokenOwnerRecord[] | null | undefined,
                message: string,
                messageType: "text" | "reaction",
                replyTo?: PublicKey
            }
        ) => {

            if (!selectedRealm || !wallet.publicKey || tokenOwnerRecord === undefined || 
                delegateRecords === undefined || registrar === undefined
            ) {
                return null
            }
        
            const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
            const realm = new PublicKey(selectedRealm.realmId)
            const vsrClient = registrar === null ? undefined : VsrClient(connection, registrar.programId)
            const tokenMint = new PublicKey(selectedRealm.tokenMint)

            const signature = await postMessageHandler(
                connection,
                wallet,
                govClient,
                realm,
                wallet.publicKey,
                tokenOwnerRecord,
                delegateRecords,
                proposal,
                tokenMint,
                message,
                messageType,
                replyTo,
                vsrClient
            )

            return signature
        },
        onSuccess: async(_, {proposal}) => {
            await client.invalidateQueries({
                queryKey: ['get-comments', {name, proposal: proposal.publicKey}]
            })
        }
    })
}