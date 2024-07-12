'use client'

import { useGetDaoMintData } from "@/app/hooks/useMint"
import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import BN from "bn.js"
import FormatBalance, { formatOptionVotes } from "../../header/VoterPanel/format-balance"
import { OptionWithVote } from "./proposal-display"
import { FaRegSquareCheck } from "react-icons/fa6"
import { useState } from "react"

type OptionDataType = {
    option: OptionWithVote, 
    index: number, 
    totalVotes: BN,
    isVoting: boolean,
    tokenName: string | null | undefined,
    decimals: number | undefined,
    setDenyVote: (b: boolean) => void,
    setVotes: (v: number[]) => void,
    votes: number[],
    denyVote: boolean,
    allVotesCasted: boolean,
    realmMeta: RealmMetaType
}

function OptionDisplay(
    {
        option, index, totalVotes, tokenName, decimals, setDenyVote,
        setVotes, votes, denyVote, allVotesCasted, isVoting, realmMeta
    }
    : OptionDataType
) {
    const denyOption = option.transactionsCount === 420 && option.transactionsNextIndex === 69
    const isVotingOver = !isVoting || allVotesCasted
    const [showPopup, setShowPopup] = useState(false)

    const optionSelected = denyOption ? 
        !isVotingOver && denyVote :
        !isVotingOver && votes.includes(index)

    let optionPctAbs = NaN

    try {
        optionPctAbs = isVotingOver ? (option.voteWeight.toNumber()/totalVotes.toNumber())*100 : NaN
    } catch {
        optionPctAbs = isVotingOver ? 
            ((option.voteWeight.div(new BN(100)).toNumber()) / (totalVotes.div(new BN(100)).toNumber())) * 100 : 
            NaN
    }
    const optionPercentage = isNaN(optionPctAbs) ? "" : 
        optionPctAbs < 1 && optionPctAbs > 0 ? 
            optionPctAbs.toFixed(1)+"%" :
            optionPctAbs.toFixed(0)+"%"

    function handleOptionClick() {
        if (denyOption) {
            setDenyVote(!denyVote)
            setVotes([])
        } else {
            let currentVotes = [...votes]
            if (!currentVotes.includes(index)) {
                currentVotes.push(index)
            } else {
                currentVotes = currentVotes.filter(v  => v !== index)
            }
            setDenyVote(false)
            setVotes(currentVotes)
        }
    }

    return (
        <li className={`w-full relative border-[1px] my-4 rounded-md text-primary-text text-sm`}
            onClick={handleOptionClick}
            style={{
                borderColor: optionSelected || option.votes.gt(new BN(0)) ? 
                    realmMeta.mainColor : 
                    realmMeta.optionsSelected,
                backgroundColor: optionSelected ? realmMeta.optionsSelected :
                    isVotingOver ? realmMeta.optionsDark :
                    realmMeta.optionsBackground
            }}
        >
            <p 
                className={"absolute h-full rounded-md"}
                style={{
                    width: optionPercentage, 
                    backgroundColor: isVotingOver ? realmMeta.secondaryColor : realmMeta.optionsDark
                }}
            >
            </p>
            <div className={`relative z-2 w-full flex gap-2 items-center p-3 ${!isVotingOver && "cursor-pointer"}`}>
                <span className={`py-[6px] px-[10px] mr-3 border-[1px]`}
                    style={{
                        backgroundColor: (optionSelected || option.votes.gt(new BN(0))) && isVoting ? 
                            realmMeta.mainColor : 
                            realmMeta.optionsSequenceColor,
                        borderColor: realmMeta.optionsSelected
                    }}
                >
                    {String.fromCharCode(65+index)}
                </span>
                {option.votes.gt(new BN(0)) && showPopup && 
                    <div className="p-4 absolute top-[-36px] border-[1px"
                        style={{backgroundColor: realmMeta.primaryBackground, border: realmMeta.optionsBackground}}
                    >
                        You have already voted on this option with <FormatBalance decimals={decimals} weight={option.votes}/> Votes
                    </div>
                }
                {option.votes.gt(new BN(0)) && <FaRegSquareCheck 
                    style={{color: realmMeta.tickColor}}
                    onMouseOver={() => setShowPopup(true)}
                    onMouseLeave={() => setShowPopup(false)}
                />}
                <span className="text-primary-text">{option.label}</span>
                {optionPercentage ? <span className="text-secondary-text">-</span> : ""}
                <span className="text-secondary-text text-sm">{optionPercentage}</span>
                {isVotingOver && <span className="text-secondary-text">-</span>}
                <span className="text-secondary-text text-sm flex flex-row gap-2 items-center">
                    {isVotingOver ?
                        window.screen.width > 620 ?
                            <FormatBalance decimals={decimals} weight={option.voteWeight}/> :
                            <span>{formatOptionVotes(option.voteWeight, decimals)}</span> :
                            ""
                    }
                    {isVotingOver ? tokenName ? tokenName : "Votes" : ""}
                </span>
            </div>
        </li>
    )
}

function ProposalOptions(
    {options, isVoting, setDenyVote, setVotes, votes, denyVote, allVotesCasted}: 
    {
        options: OptionWithVote[], 
        isVoting: boolean,
        setDenyVote: (b: boolean) => void,
        setVotes: (v: number[]) => void,
        votes: number[],
        denyVote: boolean,
        allVotesCasted: boolean
    }
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const mintDetails = useGetDaoMintData(realmMeta.name).data

    const totalVotes = options.reduce((a,b) => a.add(b.voteWeight), new BN(0))

    return (
        <ol className="w-full" type="A">
            {options.map((option, index) => (
                <OptionDisplay 
                    option={option} 
                    index={index} 
                    key={index} 
                    totalVotes={totalVotes}
                    decimals={mintDetails?.[0].decimals}
                    tokenName={mintDetails?.[0].name}
                    votes={votes}
                    setDenyVote={setDenyVote}
                    setVotes={setVotes}
                    denyVote={denyVote}
                    isVoting={isVoting}
                    allVotesCasted={allVotesCasted}
                    realmMeta={realmMeta}
                />
            ))}
        </ol>
    )
}

export default ProposalOptions