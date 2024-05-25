import { useConnection } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { PublicKey } from "@solana/web3.js"
import { Governance } from "test-governance-sdk"

export function useGetComments(name: string, proposal: PublicKey) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-comments', {name, proposal}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const programId = new PublicKey(selectedRealm.programId)
            const govRpc = new Governance(connection, programId)
            
            try {
                const comments = await govRpc.getChatMessagesByProposal(proposal)
                console.log(`fetched comments for ${proposal.toBase58()}`)
                return comments
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}