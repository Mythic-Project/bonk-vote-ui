'use client'

import ProposalOptions from "./proposal-options"
import { ProposalMeta } from "./proposal-meta"
import { StandardButton } from "../../buttons"
import { GoComment } from "react-icons/go"
import { ChatMessage, GovernanceAccount, ProposalOption, ProposalV2 } from "test-governance-sdk"
import { RealmsLink } from "./meta-components"
import Modal from "react-modal"
import { useEffect, useState } from "react"
import { customStyles } from "../../style/modal-style"
import ProposalComment from "./proposal-comment"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { RealmMetaType } from "@/app/hooks/useRealm"
import { useGetVoteRecordsForProposal } from "@/app/hooks/useVoteRecord"
import BN from "bn.js"
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"
import { UseQueryResult } from "@tanstack/react-query"
import { Comments } from "./Comments/index"
import { Reactions } from "./Comments/reactions"
import { commentsCount } from "@/app/utils/ui-utils"
import { TransactionWarning } from "./transaction-warning"
import ReactMarkdown from 'react-markdown'
import { useGetProposalBody } from "@/app/hooks/useProposalBody"

export interface OptionWithVote extends ProposalOption {
    votes: BN
}

export function ProposalDisplay(
    {
        proposal, 
        governance,
        network,
        setInitialFetch,
        comments
    } : 
    {
        proposal: ProposalV2, 
        governance: GovernanceAccount, 
        network: string,
        setInitialFetch: (b: boolean) => void,
        comments: UseQueryResult<ChatMessage[] | null, Error>
    }
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const voteRecords = useGetVoteRecordsForProposal(realmMeta.name, proposal.publicKey).data
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
    const delegateRecords = useGetDelegateRecords(realmMeta.name).data
    const proposalBody = useGetProposalBody(proposal.publicKey.toBase58(), proposal.descriptionLink).data

    const [modalIsOpen, setIsOpen] = useState(false)
    const [votes, setVotes] = useState<number[]>([])
    const [denyVote, setDenyVote] = useState(false)
    const [showComments, setShowComments] = useState(true)
    const [options, setOptions] = useState<OptionWithVote[]>(
        proposal.denyVoteWeight ?
        [...proposal.options.map((o,i) => ({
            ...o, 
            votes: new BN(0),
            label: 
                proposal.options.length === 1 ? 
                    "Yes" : 
                i === proposal.options.length -1 && o.label === "$$_NOTA_$$" ?
                    "None of the Above" :
                    o.label
        })), {
            voteWeight: proposal.denyVoteWeight,
                voteResult: {none: {}},
                transactionsCount: 420,
                transactionsExecutedCount: 0,
                transactionsNextIndex: 69,
                label: "No",
                votes: new BN(0)
        }] :
        proposal.options.map((o,i) => ({
            ...o, 
            votes: new BN(0),
            label:
                proposal.options.length === 1 ? 
                    "Yes" : 
                i === proposal.options.length -1 && o.label === "$$_NOTA_$$" ?
                    "None of the Above" :
                    o.label
        }))
    )
    
    useEffect(() => {
        if (voteRecords) {
            let optionsN = [...options]
            optionsN.forEach(o => {
                o.votes = new BN(0)
            })

            voteRecords.forEach(record => {
                if (record.vote.deny) {
                    optionsN[optionsN.length-1].votes = optionsN[optionsN.length-1].votes.add(record.voterWeight)
                } else {
                    record.vote.approve![0].forEach((o,index) => {
                        if (o.weightPercentage === 100) {
                            optionsN[index].votes = options[index].votes.add(record.voterWeight)
                        }
                    })
                }

            })
            setOptions(optionsN)
        }
    }, [voteRecords])

    const voteDuation = governance.config.votingBaseTime * 1000
    const votingAt = proposal.votingAt!.toNumber() * 1000
    const votingEndTime = votingAt + voteDuation
    const isVoting = votingEndTime >= Date.now() && proposal.state.voting ? true : false
    const allVotesCasted = voteRecords && voteRecords.length && tokenOwnerRecord !== undefined && delegateRecords !== undefined ?
        tokenOwnerRecord && delegateRecords ?
            voteRecords.length === delegateRecords.length + 1 :
        !tokenOwnerRecord && delegateRecords ?
            voteRecords.length === delegateRecords.length :
        tokenOwnerRecord && !delegateRecords ?
            voteRecords.length === 1 :
            false :
            false

    return (
        <div className="w-full p-6 rounded-lg flex flex-col gap-2"
            style={{background: realmMeta.primaryBackgroundShade ?? realmMeta.primaryBackground}}
        >
            <ProposalMeta proposal={proposal} governance={governance}/>
            <h1 className="text-lg font-semibold flex items-center gap-2 justify-between text-primary-text mt-4 mb-2 mr-4 break-all">
                {proposal.name}
                <RealmsLink proposal={proposal.publicKey} realm={governance.realm} network={network} />
            </h1>
            {proposal.descriptionLink.length > 0 && <div className="text-sm text-secondary-text mb-4 break-all">
                <ReactMarkdown
                    className="markdown"
                >
                    {proposalBody ?? proposal.descriptionLink}
                </ReactMarkdown>
            </div>}
            <TransactionWarning proposal={proposal} />
            <hr className="border-1" style={{borderColor: realmMeta.secondaryBackground}} />
            <ProposalOptions 
                options={options} 
                isVoting={isVoting} 
                setDenyVote={setDenyVote} 
                setVotes={setVotes}
                votes={votes}
                denyVote={denyVote}
                allVotesCasted={allVotesCasted}
            />
            <hr className=" border-1" style={{borderColor: realmMeta.secondaryBackground}}/>
            <div className="mt-2 flex flex-col sm:flex-row justify-between gap-4">
                { isVoting && 
                <StandardButton 
                    title={isVoting && allVotesCasted ? "Remove Vote" : "Vote" }
                    disabled={(!denyVote && votes.length === 0) && !allVotesCasted}
                    vibrant={true}
                    style={{
                        backgroundColor: (denyVote || votes.length) && isVoting && !allVotesCasted ? 
                            realmMeta.mainColor :
                            realmMeta.actionBackground
                        }}
                    onClick={() => setIsOpen(true)}
                /> }
                <div className="flex gap-4 items-center justify-between">
                    <Reactions comments={comments} proposal={proposal}/>
                    <div 
                        className="text-tertiary-text flex items-center gap-2 text-sm cursor-pointer"
                        onClick={() => setShowComments(!showComments)}>
                            <GoComment className="text-xl"/>
                            {comments.data? commentsCount(comments.data) : ""} Comments
                    </div>
                </div>
                
            </div>
            {
                showComments &&
                <Comments comments={comments} proposal={proposal}/>
            }
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
                contentLabel="Voter Weight"
                ariaHideApp={false}
            >
                <ProposalComment 
                    closeModal={() => setIsOpen(false)}
                    proposal={proposal}
                    denyVote={denyVote}
                    votes={votes}
                    tokenOwnerRecord={tokenOwnerRecord}
                    delegateRecords={delegateRecords}
                    voteRecords={voteRecords}
                    allVotesCasted={allVotesCasted}
                    setInitialFetch={setInitialFetch}
                />
            </Modal>
        </div>
    )
}