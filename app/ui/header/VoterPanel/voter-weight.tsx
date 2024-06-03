'use client'

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useGetVoterWeight } from "@/app/hooks/useVoterWeight"
import { useDaoMeta } from "@/app/providers/dao-provider"
import BN from "bn.js"
import { useState } from "react"
import { HiLightningBolt } from "react-icons/hi"
import Modal from "react-modal"
import { customStyles } from "../../style/modal-style"
import { MintInfoType, useGetDaoMintData } from "@/app/hooks/useMint"
import FormatBalance from "./format-balance"

function VoterWeightDisplay(
    {selfAmount, delegateAmount, mintData} :
    {selfAmount: {votes: BN, tokens: BN},
    delegateAmount: {votes: BN, tokens: BN},
    mintData: MintInfoType | null | undefined}
) {
    const [modalIsOpen, setIsOpen] = useState(false);
    const realmMeta = useDaoMeta() as RealmMetaType

    const totalVotesWeight = selfAmount.votes.add(delegateAmount.votes)
    const totalTokensWeight = selfAmount.tokens.add(delegateAmount.tokens)
    const pow = mintData ? new BN(10).pow(new BN(mintData.decimals)) : new BN(1)

    const multiplier = totalVotesWeight.toNumber()/totalTokensWeight.toNumber()

    return (
        <div className="ml-2">
            <div className="flex gap-2 items-center cursor-pointer font-medium" onClick={() => setIsOpen(true)}>
                <FormatBalance decimals={mintData?.decimals} weight={totalVotesWeight}/>
                {/* {mintData?.image && 
                    <span>
                        <img src={mintData.image} width={24} height={24} alt="token image" className="rounded-full" /> 
                    </span>
                } */}
                <span className="text-secondary-text font-normal">{mintData?.name ? mintData.name : "Votes"}</span>
                {
                    multiplier > 1 &&
                    <div className="flex gap-2 items-center py-2 px-4 ml-2 text-xs rounded-2xl" style={{backgroundColor: realmMeta.secondaryBackground}}>
                        <HiLightningBolt style={{color: realmMeta.mainColor}}/>
                        {multiplier.toFixed(2)}x
                    </div>
                }
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles(realmMeta.primaryBackground)}
                contentLabel="Voter Weight"
                ariaHideApp={false}
            >
                <div className="flex flex-col gap-6 py-4 px-8 items-center text-primary-text">
                    <h2 className="font-semibold">My Voting Power</h2>
                    <div className="flex flex-col items-center">
                        <h3 className="font-medium mb-2">Self Voting Power</h3>
                        <h4 className="text-secondary-text flex gap-2 text-sm">
                            <span className="">My Tokens:</span>
                           <FormatBalance decimals={mintData?.decimals} weight={selfAmount.tokens} />
                        </h4>
                        <h4 className="text-secondary-text flex gap-2 text-sm">                            
                            <span className="">My Votes:</span> 
                            <FormatBalance decimals={mintData?.decimals} weight={selfAmount.votes} />
                        </h4>
                    </div>
                    <div className="flex flex-col items-center">
                        <h3 className="font-medium mb-2">Delegated Voting Power</h3>
                        <h4 className="text-secondary-text flex gap-2 text-sm">
                            <span className="">Delegated Tokens:</span>
                            <FormatBalance decimals={mintData?.decimals} weight={delegateAmount.tokens} />
                        </h4>
                        <h4 className="text-secondary-text flex gap-2 text-sm">
                            <span className="">Delegated Votes:</span>
                            <FormatBalance decimals={mintData?.decimals} weight={delegateAmount.votes} />
                        </h4>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

function VoterWeight() {
    const {name} = useDaoMeta() as RealmMetaType
    const weights = useGetVoterWeight(name)
    const mintData = useGetDaoMintData(name).data

    return (
        weights.data ?
            <VoterWeightDisplay 
                selfAmount={weights.data.selfAmount} 
                delegateAmount={weights.data.delegateAmount}
                 mintData={mintData}
            /> :
        weights.isFetched ?
            <div className="text-secondary-text font-medium">
                No Voting Power
            </div> :
            <div className="text-secondary-text font-medium">
                Fetching Balance..
            </div>
    )
}

export default VoterWeight