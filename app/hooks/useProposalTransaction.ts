import { useConnection } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { PublicKey } from "@solana/web3.js"
import { Governance } from "test-governance-sdk"

export function useGetProposalTransaction(name: string, proposal: PublicKey) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-proposal-transaction', {name, proposal}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const {programId} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const govRpc = new Governance(connection, daoProgramId)

            try {
                const proposalTxKey = govRpc.pda.proposalTransactionAccount({
                    proposal,
                    optionIndex: 0,
                    index: 0
                }).publicKey

                const proposalTx = await govRpc.getProposalTransactionByPubkey(proposalTxKey)
                console.log(`fetched proposal transaction for proposal: ${proposal.toBase58()}`)
                return proposalTx
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}