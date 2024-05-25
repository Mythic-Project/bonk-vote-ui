import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { Governance } from "test-governance-sdk";
import { useGetRealmMeta } from "./useRealm";

export function useGetTokenOwnerRecord(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-token-record', {
            name,
            tokenOwner: publicKey
        }],
        queryFn: async() => {
            if (!publicKey || !selectedRealm) {
                return null
            }

            const {programId, realmId, tokenMint} = selectedRealm
            
            const daoProgramId = new PublicKey(programId)
            const realm = new PublicKey(realmId)
            const token = new PublicKey(tokenMint)

            const govRpc = new Governance(connection, daoProgramId)

            try {
                const tokenRecord = await govRpc.getTokenOwnerRecord(realm, publicKey, token)
                console.log("fetched token owner record")
                return tokenRecord
            } catch {
                return null
            } 
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

export function useGetTokenOwnerRecordForPubkey(name: string, torKey: PublicKey) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-token-record', {
            torKey
        }],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }

            const {programId} = selectedRealm
            const daoProgramId = new PublicKey(programId)
            const govRpc = new Governance(connection, daoProgramId)

            try {
                const tokenRecord = await govRpc.getTokenOwnerRecordByPubkey(torKey)
                console.log(`fetched token owner record for ${torKey.toBase58()}`)
                return tokenRecord
            } catch {
                return null
            } 
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

export function useGetDelegateRecords(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-delegate-records', {
            name,
            delegate: publicKey
        }],
        queryFn: async() => {
            if (!publicKey || !selectedRealm) {
                return null
            }
            
            const {programId, realmId, tokenMint} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const realm = new PublicKey(realmId)
            const token = new PublicKey(tokenMint)

            const govRpc = new Governance(connection, daoProgramId)
            
            try {
                const delegateRecord = await govRpc.getDelegateRecordsForUserInRealm(realm, publicKey, token)
                const selfTORKey = govRpc.pda.tokenOwnerRecordAccount({
                    realmAccount: realm, 
                    governingTokenMintAccount: token,
                    governingTokenOwner: publicKey
                }).publicKey

                console.log("fetched delegate record")
                return delegateRecord.filter(record => !record.publicKey.equals(selfTORKey))
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}