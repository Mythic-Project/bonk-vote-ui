import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useQuery } from "@tanstack/react-query"
import { useGetRealmConfig, useGetRealmMeta } from "./useRealm"
import { PublicKey } from "@solana/web3.js"
import { TokenOwnerRecord } from "test-governance-sdk"
import BN from "bn.js"
import { Registrar, computeVsrWeight, voterRecordKey } from "../plugin/VoterStakeRegistry/utils"
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "./useVoterRecord"
import { VsrClient } from "../plugin/VoterStakeRegistry/client"
import { Program } from "@coral-xyz/anchor"
import { VoterStakeRegistry } from "../plugin/VoterStakeRegistry/idl"
import { useGetRegistrar } from "./useVsr"

const DEFAULT_RETURN_VALUE = {
    votes: new BN(0),
}

export type VoterWeightTokensType = {
    amount: BN,
    mint: PublicKey,
    isLocked: boolean
}

export type VoterWeightType = {
    selfAmount: {
        votes: BN,
        tokens: VoterWeightTokensType[],
        isVsr: boolean,
        delegate: PublicKey | null
    },
    delegateAmount: {
        votes: BN,
    }
}

export function useGetVoterWeight(
    name: string,
) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const realmMeta = useGetRealmMeta(name)
    const realmConfig = useGetRealmConfig(name).data
    const registrar = useGetRegistrar(name).data
    const tokenOwnerRecord = useGetTokenOwnerRecord(name).data
    const delegateRecords = useGetDelegateRecords(name).data

    const enabled = 
        realmConfig !== undefined && 
        tokenOwnerRecord !== undefined && 
        delegateRecords !== undefined && 
        registrar !== undefined

    return useQuery({
        enabled,
        queryKey: ['get-voter-weight', {
            name,
            tokenOwner: publicKey
        }],
        queryFn: async(): Promise<VoterWeightType | null> => {
            if (!publicKey || !realmConfig || !realmMeta) {
                return null
            }
            
            const voterWeightAddin = realmMeta.tokenType === "council" ? 
                realmConfig.councilTokenConfig.voterWeightAddin :
                realmConfig.communityTokenConfig.voterWeightAddin

            if (!voterWeightAddin || !registrar) {
                console.log("fetched vanilla voter weights")
                return {
                    selfAmount: {
                        votes: tokenOwnerRecord ? tokenOwnerRecord.governingTokenDepositAmount : new BN(0),
                        tokens: [{
                                amount: tokenOwnerRecord ? tokenOwnerRecord.governingTokenDepositAmount : new BN(0),
                                mint: new PublicKey(realmMeta.tokenMint),
                                isLocked: false
                            }],
                        isVsr: false,
                        delegate: tokenOwnerRecord ? tokenOwnerRecord.governanceDelegate : null
                    },
                    delegateAmount: {
                        votes: delegateRecords ? delegateRecords.reduce((a,b) => a.add(b.governingTokenDepositAmount), new BN(0)) : new BN(0),
                    }
                }
            }

            const vsrClient = VsrClient(connection, voterWeightAddin)

            const weights: VoterWeightType = {
                selfAmount: tokenOwnerRecord ?
                    await getSelfAmount(
                        tokenOwnerRecord.realm, 
                        tokenOwnerRecord.governingTokenMint, 
                        tokenOwnerRecord.governingTokenOwner,
                        tokenOwnerRecord.governanceDelegate,
                        vsrClient,
                        registrar,
                    ) : 
                    {
                        votes: new BN(0),
                        tokens: [{
                            amount: new BN(0),
                            mint: new PublicKey(realmMeta.tokenMint),
                            isLocked: false
                        }],
                        isVsr: true, delegate: null
                    },
                delegateAmount: delegateRecords ?
                    await getDelegateAmount(delegateRecords, vsrClient, registrar) :
                    {...DEFAULT_RETURN_VALUE}
            }

            console.log("fetched vsr voter weights")
            return weights
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

async function getSelfAmount(
    realm: PublicKey, 
    tokenMint: PublicKey, 
    authority: PublicKey, 
    delegate: PublicKey | null,
    client: Program<VoterStakeRegistry>,
    registrar: Registrar
) {
    const [voterKey] = voterRecordKey(
        realm, 
        tokenMint, 
        authority,
        registrar.programId
    )
    
    try {
        const deposits = (await client.account.voter.fetch(voterKey)).deposits
        return {
            votes: computeVsrWeight(deposits, registrar.data.votingMints),
            tokens: deposits.flatMap(d => d.amountDepositedNative.gt(new BN(0)) ?
                [{
                    amount: d.amountDepositedNative,
                    mint: registrar.data.votingMints[d.votingMintConfigIdx].mint,
                    isLocked: d.lockup.kind.none === undefined
                }] : 
                []
            ),
            isVsr: true,
            delegate
        }
    } catch(e) {
        console.log(e)
        return {
            votes: new BN(0),
            tokens: [{
                amount: new BN(0),
                mint: tokenMint,
                isLocked: false
            }],
            isVsr: true,
            delegate: null
        }
    }
}

async function getDelegateAmount(
    delegateRecords: TokenOwnerRecord[], 
    client: Program<VoterStakeRegistry>,
    registrar: Registrar
): Promise<{votes: BN}> {
    const delegateVotes = []

    try {
        for (const record of delegateRecords) {
            const [voterKey] = voterRecordKey(
                record.realm, 
                record.governingTokenMint, 
                record.governingTokenOwner,
                registrar.programId
            )
            const weightRecord = await client.account.voter.fetch(voterKey)
            const weight = computeVsrWeight(weightRecord.deposits, registrar.data.votingMints)
            delegateVotes.push(weight)
        }
    
        return {
            votes: delegateVotes.reduce((a,b) => a.add(b), new BN(0)),
        }
    } catch {
        return {...DEFAULT_RETURN_VALUE}
    }
}