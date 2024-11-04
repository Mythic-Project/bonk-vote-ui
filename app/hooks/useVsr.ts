import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useGetRealmConfig, useGetRealmMeta, useGetRealmMetaById } from "./useRealm"
import { PublicKey } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"
import { BonkPluginClient } from "../plugin/BonkPlugin/client"
import { VsrClient } from "../plugin/VoterStakeRegistry/client"
import { VoterWithRegistrar, registrarKey, vsrVoterKey } from "../plugin/VoterStakeRegistry/utils"

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

export function useGetVsrVoter(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data
    const tokenMint = realmMeta?.tokenMint
    const realmId = realmMeta?.realmId
    
    return useQuery({
        enabled: realmConfig !== undefined,
        queryKey: ['get-vsr-voter', {endpoint: connection.rpcEndpoint, realmId, tokenMint, publicKey}],
        queryFn: async(): Promise<VoterWithRegistrar | null> => {
            if (!realmConfig || !realmMeta || !publicKey) {
                return null
            }
        
            const vsrClient = VsrClient(connection)
            const mint = new PublicKey(tokenMint!)

            const registrarAddress = registrarKey(
                realmConfig.realm,
                mint,
                vsrClient.programId
            )

            const [voterKey] = vsrVoterKey(
                realmConfig.realm,
                mint,
                publicKey,
                vsrClient.programId
            )

            try {
                const registrarData = await vsrClient.account.registrar.fetch(registrarAddress)
                const voterData = await vsrClient.account.voter.fetch(voterKey)
                console.log("fetched vsr registrar & voter")
                return {
                    registrar: registrarData,
                    registrarKey: registrarAddress,
                    voter: voterData,
                    voterKey,
                    programId: vsrClient.programId
                }
            } catch(e) {
                console.log(e)
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}