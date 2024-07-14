import { UseQueryResult } from "@tanstack/react-query";
import { ChatMessage, ProposalV2 } from "test-governance-sdk";
import Modal from "react-modal"
import { useState } from "react";
import { customStyles } from "@/app/ui/style/modal-style";
import { PublicKey } from "@solana/web3.js";
import { RxCross1 } from "react-icons/rx";
import { ellipsify } from "@/app/utils/ui-utils";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import { usePostMessage } from "@/app/hooks/usePostComment";

const reactions = [
    String.fromCodePoint(parseInt("0x1F525")), // FIRE
    String.fromCodePoint(parseInt("0x1F44D")), // THUMBS UP
    String.fromCodePoint(parseInt("0x1F44E")), // THUMBS DOWN
    String.fromCodePoint(parseInt("0x1F914")), // THINKING
]

export function Reactions(
    {comments, proposal}: {comments: UseQueryResult<ChatMessage[] | null, Error>, proposal: ProposalV2}
) {
    
    return (
        comments.data ?
            <ReactionsUI comments={comments.data} proposal={proposal}/> :
        comments.isLoading ?
            <div className="text-xs text-secondary-text">Loading reactions..</div> :
            ""
    )
}

function ReactionsUI(
    {comments, proposal}: {comments: ChatMessage[], proposal: ProposalV2}
) {
    const castedReactions = comments.filter(comment => comment.body.reaction !== undefined)
    const [modalIsOpen, setIsOpen] = useState(false)

    const realmMeta = useDaoMeta() as RealmMetaType
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
    const delegateRecords = useGetDelegateRecords(realmMeta.name).data
    
    const {
        mutateAsync: postMessageAsync,
        isPending: postMessagePending
    } = usePostMessage(realmMeta.name)

    async function handleSubmit(emoji: string) {
        await postMessageAsync({
            proposal,
            replyTo: undefined,
            message: emoji,
            messageType: "reaction",
            tokenOwnerRecord,
            delegateRecords
        })
    }
    
    return (
        <div className="flex gap-[6px] items-center">
            {reactions.map(reaction => (
                <button 
                    className="hover:scale-[2] cursor-pointer"
                    key={reaction}
                    disabled={postMessagePending}
                    onClick={() => handleSubmit(reaction)}
                >
                    {reaction}
                </button>
            ))}
            <div 
                className="ml-[2px] text-secondary-text cursor-pointer"
                onClick={() => setIsOpen(true)}
            >
                {castedReactions.length}
            </div>
            {postMessagePending && <div className="text-xs text-secondary-text">Adding..</div>}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
                contentLabel="Voter Weight"
                ariaHideApp={false}
            >
                <CastedReactionsUI 
                    closeModal={() => setIsOpen(false)}
                    reactions={castedReactions} 
                    secondaryBackground={realmMeta.secondaryBackground}
                />
            </Modal>
        </div>
    )
}

function CastedReactionsUI(
    {reactions, closeModal, secondaryBackground}: 
    {reactions: ChatMessage[], closeModal: () => void, secondaryBackground: string}
) {
    const [selectedKey, setSelectedKey] = useState(0)

    const symbols: string[] = []
    const casters: PublicKey[][] = []

    reactions.forEach(reaction => {
        const unicode = reaction.body.reaction![0]
        if (symbols.includes(unicode)) {
            const index = symbols.findIndex(el => el === unicode)
            casters[index].push(reaction.author)
        } else {
            symbols.push(unicode)
            casters.push([reaction.author])
        }
    })

    return (
        <div className="h-80">
            <div className="flex gap-8 justify-between">
                {symbols.map((symbol, index) => (
                    <div 
                        className="cursor-pointer flex gap-2 items-center" 
                        key={symbol} onClick={() => setSelectedKey(index)}
                    >
                        {symbol}
                        <span className="text-sm text-secondary-text">
                            {casters[index].length}
                        </span>
                    </div>
                ))}
                <RxCross1
                    className="text-xl cursor-pointer text-primary-text"
                    onClick={closeModal}
                />
            </div>
            <hr className="border-[1px] w-full my-4" style={{borderColor: secondaryBackground}} />
            <div className="flex flex-col gap-4">
                {casters.length > 0 && casters[selectedKey].map((key, index) => (
                    <div className="flex gap-6 justify-between text-sm text-primary-text" key={index}>
                        {ellipsify(key.toBase58(), 8)}
                        <div className="">
                            {symbols[selectedKey]}
                        </div>
                    </div>
                ))}
            </div>
            {!casters.length && "No reactions."}
        </div>
    )
}