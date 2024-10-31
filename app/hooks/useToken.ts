import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { useGetRegistrar } from "./useVsr"
import { PublicKey } from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor"
import BN from "bn.js"

export interface TokenHoldingReturnType {
    mint: PublicKey,
    account: PublicKey,
    balance: string,
    decimals: number
}

export function useGetTokensHolding(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
 
    const enabled = registrar !== undefined

    return useQuery({
        enabled,
        queryKey: [
            'get-tokens-holding', 
            {
                name,
                publicKey
            }
        ],
        queryFn: async() => {
            if (!publicKey || !selectedRealm) {
                return null
            }
            
            const mintsForRegistrar = registrar ? 
                registrar.data.governingTokenMint :
                null
            
            const mints = mintsForRegistrar ?
                [mintsForRegistrar] :
                [new PublicKey(selectedRealm.tokenMint)]
            
            if (mints.length === 0) {
                return null
            }

            const holdings: TokenHoldingReturnType[] = []

            for (const mint of mints) {
                const userAta = anchor.utils.token.associatedAddress({mint, owner: publicKey})

                try {
                    const acc = await connection.getParsedAccountInfo(userAta)
                    const parsedData = acc.value?.data as any
    
                    const holding: TokenHoldingReturnType = {
                        mint,
                        account: userAta,
                        balance: parsedData.parsed.info.tokenAmount ? parsedData.parsed.info.tokenAmount.amount : "0",
                        decimals: parsedData.parsed.info.tokenAmount ? parsedData.parsed.info.tokenAmount.decimals : 0,
                    }
    
                    console.log("fetched token holding")
                    holdings.push(holding)
                } catch(e) {
                }
            }
            
            return holdings
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}