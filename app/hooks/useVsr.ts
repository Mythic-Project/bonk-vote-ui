import { useConnection } from "@solana/wallet-adapter-react"
import { useGetRealmConfig, useGetRealmMeta, useGetRealmMetaById } from "./useRealm"
import { PublicKey } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"
import { BonkPluginClient } from "../plugin/BonkPlugin/client"
import { registrarKey } from "../plugin/BonkPlugin/utils"

export function useGetRegistrar(name: string) {
    const {connection} = useConnection()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data
    const tokenMint = realmMeta?.tokenMint
    const realmId = realmMeta?.realmId
    
    return useQuery({
        enabled: realmConfig !== undefined,
        queryKey: ['get-registrar', {endpoint: connection.rpcEndpoint, realmId, tokenMint}],
        queryFn: async() => {
            if (!realmConfig || !realmMeta) {
                return null
            }
            
            const voterWeightAddin = realmMeta.tokenType === "council" ? 
                realmConfig.councilTokenConfig.voterWeightAddin :
                realmConfig.communityTokenConfig.voterWeightAddin

            if (!voterWeightAddin) {
                return null
            }

            const bonkClient = BonkPluginClient(connection, voterWeightAddin)

            const registrar = registrarKey(
                realmConfig.realm,
                new PublicKey(tokenMint!),
                voterWeightAddin
            )

            try {
                const registrarData = await bonkClient.account.registrar.fetch(registrar)
                console.log("fetched registrar")
                return {
                    data: registrarData,
                    publicKey: registrar,
                    programId: voterWeightAddin
                }
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}