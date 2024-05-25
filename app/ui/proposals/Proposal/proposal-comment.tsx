'use client'

import { useCastVote } from "@/app/hooks/useCastVote"
import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { useState } from "react"
import { RxCross1 } from "react-icons/rx"
import { ProposalV2, TokenOwnerRecord, VoteRecord } from "test-governance-sdk"
import { StandardButton } from "../../buttons"
import { Spinner } from "../../animations"
import Link from "next/link"
import { getLink, txDropErrorMsg } from "@/app/utils/ui-utils"

function ProposalComment(
    {proposal, closeModal, denyVote, votes, tokenOwnerRecord, delegateRecords, voteRecords, allVotesCasted, setInitialFetch}:
    {
        proposal: ProposalV2,
        closeModal: () => void,
        denyVote: boolean,
        votes: number[],
        tokenOwnerRecord: TokenOwnerRecord | null | undefined,
        delegateRecords: TokenOwnerRecord[] | null | undefined,
        voteRecords: VoteRecord[] | null | undefined,
        allVotesCasted: boolean,
        setInitialFetch: (b: boolean) => void
    }
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    
    const {
        mutateAsync: castVoteFn,
        data: castVoteData,
        isPending: castVotePending,
        isError: castVoteFailed,
        error: castVoteError
    } = useCastVote(realmMeta.name)

    const [comment, setComment] = useState("")
    const [errorMsg, setError] = useState("")
    const action = allVotesCasted ? "Remove" : "Cast"
    const pendingAction = allVotesCasted ? "Removing" : "Casting"

    async function handleSubmit() {
        setError("")

        if (!voteRecords) {
            setError("Existing votes are not loaded yet, please wait and try again.")
            return
        }

        const tokenOwnerRecordFiltered = tokenOwnerRecord ?
            voteRecords.some(v => v.governingTokenOwner.equals(tokenOwnerRecord.governingTokenOwner)) ?
            null : tokenOwnerRecord :
            tokenOwnerRecord
        
        const delegateRecordsFiltered = delegateRecords ?
            delegateRecords.filter(r => !voteRecords.some(v => v.governingTokenOwner.equals(r.governingTokenOwner))) :
            delegateRecords
        
        setInitialFetch(false)
        
        await castVoteFn({
            proposal,
            votes,
            denyVote,
            message: comment ? comment : undefined,
            tokenOwnerRecord: allVotesCasted ? tokenOwnerRecord : tokenOwnerRecordFiltered,
            delegateRecords: allVotesCasted ? delegateRecords : delegateRecordsFiltered,
            removeVotes: allVotesCasted ? true : false,
        })
    }

    return (
        <div className="flex flex-col gap-6 p-4 w-80">
            <div className="flex justify-between text-primary-text">
                <h2 className="text-lg font-medium">Confirm your vote</h2>
                <RxCross1 
                    className="text-xl cursor-pointer"
                    onClick={closeModal}
                />
            </div>
            <textarea 
                placeholder={"Write your comment.."} 
                className=" placeholder:text-placeholder-shade 
                    placeholder:text-sm h-24 resize-none
                    w-11/12 p-4 rounded-lg z-5 border-[1px]"
                    style={{backgroundColor: realmMeta.secondaryBackground, borderColor: realmMeta.optionsSelected }}
                    value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <hr className="border-[1px] w-full mb-4" style={{borderColor: realmMeta.secondaryBackground}} />
            <div className="flex gap-4 items-center w-full">
                <StandardButton
                    title={
                        castVotePending ?
                            <span className="flex gap-2 items-center">
                                <Spinner mainColor={realmMeta.mainColor} />
                                {pendingAction} Vote..
                            </span> :
                            `${action} Vote` 
                    }
                    style={{backgroundColor: castVotePending || !comment ? realmMeta.actionBackground : realmMeta.mainColor}}
                    vibrant={true}
                    onClick={handleSubmit}
                />
                <StandardButton title="Cancel" onClick={closeModal}/>
            </div>

            {
                castVoteFailed || errorMsg ?
                    <div className="text-red-400 text-sm mt-4">
                        {errorMsg}
                        {castVoteFailed && txDropErrorMsg(castVoteError.message)}
                    </div> :
                    ""
            }
            {
                castVoteData ?
                <div className="text-primary-text text-sm mt-4 text-center">
                    <p className="text-primary-text flex gap-2">
                        Transaction Successful.
                        <Link
                            href={getLink(castVoteData, 'tx', realmMeta.network)} 
                            className="text-secondary-text"
                        >
                            View transaction
                        </Link>
                    </p>
                </div> : 
                ""
            }
        </div>
    )
}

export default ProposalComment