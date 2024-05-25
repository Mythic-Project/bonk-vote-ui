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