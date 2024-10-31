import { fetchMetadata, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata"
import { useConnection } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {publicKey} from "@metaplex-foundation/umi"
import { PublicKey } from "@solana/web3.js"
import { useGetRealmConfig, useGetRealmMeta } from "./useRealm"
import axios from "axios"
import { useGetRegistrar } from "./useVsr"
import { ellipsify } from "../utils/ui-utils"
import { BN } from "bn.js"

export type MintInfoType = {
    address: PublicKey,
    name: string | null,
    decimals: number,
    image: string | null
}

export function useGetDaoMintData(name: string) {
    const {connection} = useConnection()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data
    const registrar = useGetRegistrar(name).data

    return useQuery({
        enabled: realmConfig !== undefined && registrar !== undefined,
        queryKey: ['get-mint-data', {name}],
        queryFn: async(): Promise<MintInfoType[] | null> => {
            if (!realmConfig || !realmMeta) {
                return null
            }
            
            const mintsForRegistrar = registrar ? 
                registrar.data.governingTokenMint :
                null
            
            const mints = mintsForRegistrar ?
                [mintsForRegistrar] :
                [new PublicKey(realmMeta.tokenMint)]
            
            if (mints.length === 0) {
                return null
            }

            const umi = createUmi(connection.rpcEndpoint)

            const mintInfos: MintInfoType[] = []

            for (const mint of mints) {
                try {
                    const tokenInfo = await connection.getParsedAccountInfo(mint)
                    const parsedData = tokenInfo.value?.data as any
                    const decimals = parsedData.parsed.info.decimals as number
                    console.log(`fetched mint data for ${ellipsify(mint.toBase58())}`)
    
                    try {
                        const metadataKey = findMetadataPda(umi, {mint: publicKey(mint) })
                        const metadata = await fetchMetadata(umi, metadataKey) 
                        console.log(`fetched metadata for ${ellipsify(mint.toBase58())}`)
    
                        try {
                            const uriInfo = await axios.get(metadata.uri)
                            if (uriInfo.data.image) {
                                const imageLink = uriInfo.data.image as string
                                mintInfos.push({
                                    decimals,
                                    name: metadata.symbol,
                                    image: imageLink,
                                    address: mint
                                })
                            }
    
                            mintInfos.push({
                                decimals,
                                name: metadata.symbol,
                                image: null,
                                address: mint

                            })
                        } catch {
                            mintInfos.push({
                                decimals,
                                name: metadata.symbol,
                                image: null,
                                address: mint
                            })
                        }
                    } catch {
                        mintInfos.push({
                            decimals,
                            name: null,
                            image: null,
                            address: mint
                        })
                    }
                } catch(e) {
                    console.log(e)
                    return null
                }
            }

            return mintInfos  
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}