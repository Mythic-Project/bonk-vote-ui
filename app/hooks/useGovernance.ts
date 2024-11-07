import { useConnection } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { PublicKey } from "@solana/web3.js"
import { Governance } from "test-governance-sdk"

export function useGetGovernanceAccounts(name: string) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-governance', {name}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const {programId, realmId} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const realm = new PublicKey(realmId)

            const govRpc = new Governance(connection, daoProgramId)
            
            try {
                const governances = await govRpc.getGovernanceAccountsByRealm(realm)
                return governances.filter(governance => {
                    if (selectedRealm.tokenType === "council") {
                        return !governance.config.councilVoteThreshold.disabled
                    } else {
                        return !governance.config.communityVoteThreshold.disabled
                    }
                })
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

export function useGetDefaultGovernance(name: string) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const defaultGovernance = new PublicKey("Uq5BRkVfdBpMknZJHw6huS3dunEgJpUDv3M2DG3BfQg")

    return useQuery({
        queryKey: ['get-default-governance', {defaultGovernance}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const {programId} = selectedRealm
            const daoProgramId = new PublicKey(programId)
            const govRpc = new Governance(connection, daoProgramId)
            
            try {
                const governance = await govRpc.getGovernanceAccountByPubkey(defaultGovernance)
                console.log("fetched the default governance")
                return governance
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}