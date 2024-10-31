import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { useGetRealmMeta } from "./useRealm";
import { useGetRegistrar } from "./useVsr";
import { DEFAULT_TOKEN_VOTER_PROGRAM_ID, tokenVwrKey } from "../plugin/TokenVoter/utils";
import BN from "bn.js";
import { StakeDepositReceiptType, StakeIdlClient } from "../plugin/TokenStaking/client";
import { ProgramAccount } from "@coral-xyz/anchor";

export interface TokenOwnerRecordWithPluginData extends TokenOwnerRecord {
    tokenVoter: {
        voterWeight: BN,
        voterWeightExpiry: BN | null
    } | null,
    stakeDepositReceipts: ProgramAccount<StakeDepositReceiptType>[] | null
}

export function useGetTokenOwnerRecord(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const registrar = useGetRegistrar(name).data
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        enabled: registrar !== undefined,
        queryKey: ['get-token-record', {
            name,
            tokenOwner: publicKey
        }],
        queryFn: async(): Promise<TokenOwnerRecordWithPluginData | null> => {
            if (!publicKey || !selectedRealm) {
                return null
            }

            const {programId, realmId, tokenMint} = selectedRealm
            
            const daoProgramId = new PublicKey(programId)
            const realm = new PublicKey(realmId)
            const token = new PublicKey(tokenMint)

            const govRpc = new Governance(connection, daoProgramId)
            const stakingClient = StakeIdlClient(connection);

            try {
                const tokenRecord = await govRpc.getTokenOwnerRecord(realm, publicKey, token)
                console.log("fetched token owner record")

                const returnTokenRecord: TokenOwnerRecordWithPluginData = {
                    ...tokenRecord, 
                    tokenVoter: null, 
                    stakeDepositReceipts: []
                }

                if (registrar) {
                    const stakePool = registrar.data.stakePool
                    const [tokenVwrAddress] = tokenVwrKey(realm, token, publicKey, DEFAULT_TOKEN_VOTER_PROGRAM_ID)
                    const tokenVwr = await govRpc.getVoterWeightRecord(tokenVwrAddress)
                    returnTokenRecord.tokenVoter = tokenVwr

                    const stakeDepositReceipts = await stakingClient.account.stakeDepositReceipt.all([
                        {
                            memcmp: {
                              offset: 8,
                              bytes: publicKey.toBase58(),
                            }     
                        },
                        {
                            memcmp: {
                              offset: 72,
                              bytes: stakePool.toBase58(),
                            },       
                        }
                    ])

                    returnTokenRecord.stakeDepositReceipts = stakeDepositReceipts
                    console.log("fetched plugin info for TOR")
                }

                return returnTokenRecord
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
    const registrar = useGetRegistrar(name).data

    return useQuery({
        enabled: registrar !== undefined,
        queryKey: ['get-delegate-records', {
            name,
            delegate: publicKey
        }],
        queryFn: async(): Promise<TokenOwnerRecordWithPluginData[] | null> => {
            if (!publicKey || !selectedRealm) {
                return null
            }
            
            const {programId, realmId, tokenMint} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const realm = new PublicKey(realmId)
            const token = new PublicKey(tokenMint)

            const govRpc = new Governance(connection, daoProgramId)
            const stakingClient = StakeIdlClient(connection);

            try {
                const delegateRecord = await govRpc.getDelegateRecordsForUserInRealm(realm, publicKey, token)
                const selfTORKey = govRpc.pda.tokenOwnerRecordAccount({
                    realmAccount: realm, 
                    governingTokenMintAccount: token,
                    governingTokenOwner: publicKey
                }).publicKey

                console.log("fetched delegate record")

                const records = delegateRecord.filter(record => !record.publicKey.equals(selfTORKey)).map(
                    r => ({...r, tokenVoter: null, stakeDepositReceipts: null})
                )

                const returnRecords: TokenOwnerRecordWithPluginData[] = []

                if (registrar) {
                    const stakePool = registrar.data.stakePool

                    for (const record of records) {
                        const recordItem: TokenOwnerRecordWithPluginData = record

                        const [tokenVwrAddress] = tokenVwrKey(
                            realm, token, record.governingTokenOwner, DEFAULT_TOKEN_VOTER_PROGRAM_ID
                        )
                        const tokenVwr = await govRpc.getVoterWeightRecord(tokenVwrAddress)
                        recordItem.tokenVoter = tokenVwr
    
                        const stakeDepositReceipts = await stakingClient.account.stakeDepositReceipt.all([
                            {
                                memcmp: {
                                  offset: 0,
                                  bytes: publicKey.toBase58(),
                                }            
                            },
                            {
                                memcmp: {
                                  offset: 72,
                                  bytes: stakePool.toBase58(),
                                },       
                            }
                        ])
    
                        recordItem.stakeDepositReceipts = stakeDepositReceipts
                        returnRecords.push(recordItem)
                    }
                    console.log("fetched plugin info for delegate TOR")
                }

                return registrar ? returnRecords : records
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}