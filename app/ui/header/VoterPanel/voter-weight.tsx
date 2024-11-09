'use client'

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import BN from "bn.js"
import { useState } from "react"
import { HiLightningBolt } from "react-icons/hi"
import Modal from "react-modal"
import { customStyles } from "../../style/modal-style"
import { MintInfoType, useGetDaoMintData } from "@/app/hooks/useMint"
import FormatBalance from "./format-balance"
import { PublicKey } from "@solana/web3.js"
import { TokenOwnerRecordWithPluginData, useGetDelegateRecords, useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"

function VoterWeightDisplay(
    {selfRecord, delegateRecords, mintData} :
    {
        selfRecord: TokenOwnerRecordWithPluginData,
        delegateRecords: TokenOwnerRecordWithPluginData[],
        mintData: MintInfoType[] | null | undefined}
) {
    const realmMeta = useDaoMeta() as RealmMetaType

    const defaultMintIndex = mintData ? 
        mintData.findIndex(m => m.address.equals(new PublicKey(realmMeta.tokenMint))) :
        0

    const selfAmountToken = selfRecord.tokenVoter?.voterWeight ?? new BN(0)

    const selfAmountSdr = selfRecord.stakeDepositReceipts ? 
        selfRecord.stakeDepositReceipts.reduce((s,b) => s.add(b.account.depositAmount), new BN(0)) :
        new BN(0)

    const delegateAmountToken = delegateRecords.reduce((sum, record) => (
        (record.tokenVoter?.voterWeight ?? new BN(0)).add(sum)
    ), new BN(0))

    const delegateAmountSdr = delegateRecords.reduce((sum, record) => (
        (record.stakeDepositReceipts ? 
            record.stakeDepositReceipts.reduce((s,b) => s.add(b.account.depositAmount), new BN(0)) :
            new BN(0)
        ).add(sum)
    ), new BN(0))

    const totalVotesWeightToken = selfAmountToken.add(delegateAmountToken)
    const totalVotesSdr = selfAmountSdr.add(delegateAmountSdr)

    return (
        <div className="ml-2">
            <div className="flex flex-col gap-2 items-start cursor-pointer text-sm font-small">
                <div className="flex gap-2"> 
                    <FormatBalance decimals={mintData?.[0].decimals} weight={totalVotesSdr}/>
                    <span className="text-secondary-text font-normal">Staked {
                        mintData?.[defaultMintIndex].name ? mintData[defaultMintIndex].name : "Votes"}</span>
                </div>
                <div className="flex gap-2">
                    <FormatBalance decimals={mintData?.[0].decimals} weight={totalVotesWeightToken}/>
                    <span className="text-secondary-text font-normal">Deposited {
                        mintData?.[defaultMintIndex].name ? mintData[defaultMintIndex].name : "Votes"}</span>
                </div>

                {/* {mintData?.image && 
                    <span>
                        <img src={mintData.image} width={24} height={24} alt="token image" className="rounded-full" /> 
                    </span>
                } */}
            </div>
            
        </div>
    )
}

function VoterWeight() {
    const {name} = useDaoMeta() as RealmMetaType
    const selfRecords = useGetTokenOwnerRecord(name)
    const delegateRecords = useGetDelegateRecords(name)

    const mintData = useGetDaoMintData(name).data

    return (
        selfRecords.data && delegateRecords.data ?
            <VoterWeightDisplay 
                selfRecord={selfRecords.data} 
                delegateRecords={delegateRecords.data}
                 mintData={mintData}
            /> :
        selfRecords.isFetched && delegateRecords.isFetched ?
            <div className="text-secondary-text font-medium">
                No Voting Power
            </div> :
            <div className="text-secondary-text font-medium">
                Fetching Balance..
            </div>
    )
}

export default VoterWeight