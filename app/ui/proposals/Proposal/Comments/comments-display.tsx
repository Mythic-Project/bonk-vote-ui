'use client'

import { ChatMessage, ProposalV2 } from "test-governance-sdk";
import { StandardButton } from "@/app/ui/buttons";
import { useEffect, useState } from "react";
import { ChatMessageWithTimeStamp, Comment } from "./comment";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import { usePostMessage } from "@/app/hooks/usePostComment";
import { txDropErrorMsg } from "@/app/utils/ui-utils";

export function CommentsDisplay(
    {comments, proposal}: {comments: ChatMessage[], proposal: ProposalV2}
) {
    const messages = comments.filter(comment => comment.body.text !== undefined)
    const topLevelMessages = messages.filter(msg => msg.replyTo === null) as any
    const topLevelMsgsSorted = topLevelMessages.sort(
        (a: ChatMessageWithTimeStamp,b: ChatMessageWithTimeStamp) => b.unixTimestamp.sub(a.unixTimestamp).toNumber()
    )

    const realmMeta = useDaoMeta() as RealmMetaType
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
    const delegateRecords = useGetDelegateRecords(realmMeta.name).data
    
    const [newMsg, setNewMsg] = useState("")
    const [loadedComments, setLoadedComments] = useState<ChatMessageWithTimeStamp[]>([])

    const {
        mutateAsync: postMessageAsync,
        isError: postMessageFailed,
        error: postMessageError,
        isPending: postMessagePending
    } = usePostMessage(realmMeta.name)

    async function handleSubmit() {
        await postMessageAsync({
            proposal,
            replyTo: undefined,
            message: newMsg,
            messageType: "text",
            tokenOwnerRecord,
            delegateRecords
        })

        setNewMsg("")
    }

    function loadComments() {
        const newLoadedCommetns = topLevelMsgsSorted.slice(0, loadedComments.length+8)
        setLoadedComments(newLoadedCommetns)
    }

    useEffect(() => {
        loadComments()
    }, [comments])

    return (
        <div className="w-full flex flex-col">
            <hr className="border-[1px] w-full mt-2" style={{borderColor: realmMeta.secondaryBackground}} />
            <div className="w-full flex gap-2 mt-4">
                <input 
                    type="text"
                    placeholder="Write your reply..."
                    className="
                        placeholder:text-secondary-text p-4 rounded-lg text-sm z-5
                        placeholder:font-light w-10/12"
                    style={{backgroundColor: realmMeta.secondaryBackground}}
                    onChange={(e) => setNewMsg(e.target.value)}
                    value={newMsg}
                />
                <StandardButton
                    title={postMessagePending ? "Posting..." : "Post"}
                    addStyles={`w-2/12`}
                    style={{backgroundColor: !newMsg || postMessagePending ? realmMeta.secondaryBackground : realmMeta.mainColor}}
                    disabled={!newMsg || postMessagePending}
                    onClick={handleSubmit}
                    customPad="py-[6px] px-2"
                />
            </div>
            {postMessageFailed && <div className="text-red-400 text-sm mt-4">
                {txDropErrorMsg(postMessageError.message)}
            </div>}
            <hr className="border-[1px] w-full my-4" style={{borderColor: realmMeta.secondaryBackground}} />
            {
                loadedComments.map(msg => (
                    <div key={msg.publicKey.toBase58()} className="mb-2">
                        <Comment 
                            subComments={comments.filter(comment => comment.replyTo?.equals(msg.publicKey))}
                            comment={msg} 
                            proposal={proposal}

                        />
                    </div> 
                ))
            }
            {topLevelMessages.length > loadedComments.length &&
                <div 
                    className="text-sm cursor-pointer" 
                    style={{color: realmMeta.mainColor}}
                    onClick={loadComments}
                >
                    Load more comments..
                </div>
            }          
        </div>
    )
}