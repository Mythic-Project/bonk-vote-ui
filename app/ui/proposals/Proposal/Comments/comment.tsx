'use client'

import { useGetCivicIdentity } from "@/app/hooks/useCivicIdentity";
import { usePostMessage } from "@/app/hooks/usePostComment";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { StandardButton } from "@/app/ui/buttons";
import { ellipsify, getLink, txDropErrorMsg } from "@/app/utils/ui-utils";
import BN from "bn.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime"
import Link from "next/link";
import { useState } from "react";
import { BsReplyAllFill } from "react-icons/bs";
import { FaReply } from "react-icons/fa6";
import { ChatMessage, ProposalV2 } from "test-governance-sdk";
import ProfileImage from "../profile-image";

dayjs.extend(relativeTime)

export interface ChatMessageWithTimeStamp extends ChatMessage {
    unixTimestamp: BN
}

function CommentUI(
    {comment, showSubForm, setShowForm, network}: 
    {
        comment: ChatMessage, 
        showSubForm?: boolean, 
        network: string, 
        setShowForm?: (b: boolean) => void, 
    }
) {
    const msg = comment as any as ChatMessageWithTimeStamp
    const realmMeta = useDaoMeta() as RealmMetaType
    const civicProfile = useGetCivicIdentity(comment.author)

    return ( 
        <div className="flex flex-col gap-4 p-4 rounded-lg w-full" style={{backgroundColor: realmMeta.secondaryBackground}}>
            <div className="w-full flex justify-between">
                <div className="flex gap-3 items-center">
                    <ProfileImage 
                        image={civicProfile.data?.image?.url} 
                        fallbackAddress={msg.author}
                        backgroundColor={realmMeta.actionBackground}
                    />
                    <Link
                        href={getLink(msg.author.toBase58(), "account", network)}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        passHref
                    >
                        <h3 className="text-primary-text text-sm">
                            {civicProfile.data?.name?.value ?? ellipsify(msg.author.toBase58())}
                        </h3>
                    </Link>
                    <span className="text-placeholder-shade text-xs hidden sm:block">
                        {dayjs(msg.unixTimestamp.toNumber()*1000).fromNow()}
                    </span>
                </div>
                {setShowForm ?
                    <h4 
                        className="text-sm flex gap-2 items-center mr-4 cursor-pointer"
                        style={{color: realmMeta.mainColor}}
                        onClick={() => setShowForm(!showSubForm)}
                    >
                        <FaReply />
                        Reply
                    </h4> :
                    "" 
            }
            </div>
            <p className="text-primary-text text-sm ml-1">
                {msg.body.text![0]}
            </p>
            <div className="text-placeholder-shade text-xs ml-1 sm:hidden">
                {dayjs(msg.unixTimestamp.toNumber()*1000).fromNow()}
            </div>
        </div>
    )
}

export function Comment(
    {comment, subComments, proposal} : 
    {comment: ChatMessage, proposal: ProposalV2, subComments: ChatMessage[]}
) {
    const [showSubForm, setShowSubForm] = useState(false)
    const [newMsg, setNewMsg] = useState("")

    const realmMeta = useDaoMeta() as RealmMetaType
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
    const delegateRecords = useGetDelegateRecords(realmMeta.name).data

    const {
        mutateAsync: postMessageAsync,
        isError: postMessageFailed,
        error: postMessageError,
        isPending: postMessagePending
    } = usePostMessage(realmMeta.name)

    async function handleSubmit() {
        await postMessageAsync({
            proposal,
            replyTo: comment.publicKey,
            message: newMsg,
            messageType: "text",
            tokenOwnerRecord,
            delegateRecords
        })

        setNewMsg("")
    }

    return (
        <div className="flex flex-col gap-2 w-full items-end">
            <CommentUI 
                comment={comment} 
                setShowForm={setShowSubForm} 
                showSubForm={showSubForm} 
                network={realmMeta.network}
            />
            <div className="w-full">
                {
                    subComments.map(subComment => (
                        <div className="flex gap-3 p-2" key={subComment.publicKey.toBase58()}>
                            <BsReplyAllFill className="text-placeholder-shade text-2xl rotate-90 scale-y-[-1]"/>
                            <CommentUI comment={subComment} network={realmMeta.network}/>
                        </div>
                    ))
                }
            </div>
            {showSubForm && <div className="flex gap-2 w-11/12 px-2 mb-3">
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
            </div>}
            {postMessageFailed && <div className="text-red-400 text-sm mt-4">
                {txDropErrorMsg(postMessageError.message)}
            </div>}
        </div>
    )
}