import { fetchMetadata, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata"
import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {publicKey} from "@metaplex-foundation/umi"
import { PublicKey } from "@solana/web3.js"
import { useGetRealmConfig, useGetRealmMeta } from "./useRealm"

export function useGetDaoMintData(name: string) {
    const {connection} = useConnection()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data

    return useQuery({
        enabled: realmConfig !== undefined,
        queryKey: ['get-mint-data', {name}],
        queryFn: async() => {
            if (!realmConfig || !realmMeta) {
                return null
            }
            
            const voterWeightAddin = realmMeta.tokenType === "council" ? 
                realmConfig.councilTokenConfig.voterWeightAddin :
                realmConfig.communityTokenConfig.voterWeightAddin
            
            
            try {
                const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(realmMeta.tokenMint))
                const parsedData = tokenInfo.value?.data as any
                const decimals = parsedData.parsed.info.decimals
                console.log("fetched mint data")

                if (voterWeightAddin) {
                    return {
                        decimals,
                        name: undefined
                    }
                }

                try {
                    const umi = createUmi(connection.rpcEndpoint)
                    const metadataKey = findMetadataPda(umi, {mint: publicKey(realmMeta.tokenMint) })
                    const metadata = await fetchMetadata(umi, metadataKey)
                    console.log("fetched metadata")

                    return {
                        decimals,
                        name: metadata.symbol
                    }
                } catch {
                    return {
                        decimals,
                        name: undefined
                    }
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