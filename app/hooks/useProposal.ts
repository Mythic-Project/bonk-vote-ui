import { useConnection } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { PublicKey } from "@solana/web3.js"
import { ProposalV2, Governance } from "test-governance-sdk"
import { useGetGovernanceAccounts } from "./useGovernance"

export function useGetProposals(name: string) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const governances = useGetGovernanceAccounts(name).data

    return useQuery({
        enabled: governances !== undefined,
        queryKey: ['get-proposals', {name}],
        queryFn: async() => {
            if (!selectedRealm || !governances) {
                return null
            }
            
            const {programId, tokenMint} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const token = new PublicKey(tokenMint)
            const govRpc = new Governance(connection, daoProgramId)
            
            try {
                const proposals: ProposalV2[] = []

                for (const governance of governances) {
                    const currentProposals = await govRpc.getProposalsforGovernance(governance.publicKey)
                    const proposalsForToken = currentProposals.filter(proposal => proposal.governingTokenMint.equals(token))
                    // Filter proposals that never reached voting state
                    const proposalsWithVoting = proposalsForToken.filter(proposal => proposal.votingAt !== null)
                    const nonCancelledProposals = proposalsWithVoting.filter(proposal => !proposal.state.cancelled)
                    proposals.push(...nonCancelledProposals)
                }
                console.log("fetched proposals")

                return proposals.sort((a,b) => b.votingAt!.sub(a.votingAt!).toNumber())
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

export function useGetProposal(name: string, proposal: PublicKey, refetch?: boolean) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const proposals = useGetProposals(name).data

    return useQuery({
        enabled: proposals !== undefined,
        queryKey: ['get-proposal', {name, proposal}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }

            if (proposals && !refetch) {
                console.log("prefetched data taken.")
                return proposals.find(prop => prop.publicKey.equals(proposal))!
            }
            
            const {programId} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const govRpc = new Governance(connection, daoProgramId)

            try {
                const prop = await govRpc.getProposalByPubkey(proposal)
                console.log(`fetched proposal: ${proposal.toBase58()}`)
                return prop
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}