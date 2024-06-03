import { fetchMetadata, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata"
import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {publicKey} from "@metaplex-foundation/umi"
import { PublicKey } from "@solana/web3.js"
import { useGetRealmConfig, useGetRealmMeta } from "./useRealm"
import axios from "axios"

export type MintInfoType = {
    name: string | null,
    decimals: number,
    image: string | null
}
export function useGetDaoMintData(name: string) {
    const {connection} = useConnection()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data

    return useQuery({
        enabled: realmConfig !== undefined,
        queryKey: ['get-mint-data', {name}],
        queryFn: async(): Promise<MintInfoType | null> => {
            if (!realmConfig || !realmMeta) {
                return null
            }
            
            const voterWeightAddin = realmMeta.tokenType === "council" ? 
                realmConfig.councilTokenConfig.voterWeightAddin :
                realmConfig.communityTokenConfig.voterWeightAddin
            
            try {
                const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(realmMeta.tokenMint))
                const parsedData = tokenInfo.value?.data as any
                const decimals = parsedData.parsed.info.decimals as number
                console.log("fetched mint data")

                if (voterWeightAddin) {
                    return {
                        decimals,
                        name: null,
                        image: null
                    }
                }

                try {
                    const umi = createUmi(connection.rpcEndpoint)
                    const metadataKey = findMetadataPda(umi, {mint: publicKey(realmMeta.tokenMint) })
                    const metadata = await fetchMetadata(umi, metadataKey) 
                    console.log("fetched metadata")

                    try {
                        const uriInfo = await axios.get(metadata.uri)
                        if (uriInfo.data.image) {
                            const imageLink = uriInfo.data.image as string
                            return {
                                decimals,
                                name: metadata.symbol,
                                image: imageLink
                            }
                        }

                        return {
                            decimals,
                            name: metadata.symbol,
                            image: null
                        }
                    } catch {
                        return {
                            decimals,
                            name: metadata.symbol,
                            image: null
                        }
                    }
                } catch {
                    return {
                        decimals,
                        name: null,
                        image: null
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