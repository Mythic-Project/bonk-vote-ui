'use client'

import { UseQueryResult } from "@tanstack/react-query";
import { ChatMessage, ProposalV2 } from "test-governance-sdk";
import { CommentsDisplay } from "./comments-display";
import { CommentsPulseModal } from "@/app/ui/animations";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { RealmMetaType } from "@/app/hooks/useRealm";


export function Comments(
    {comments, proposal} :
    {comments: UseQueryResult<ChatMessage[] | null, Error>, proposal: ProposalV2}
) {
    const {primaryBackground, secondaryBackground} = useDaoMeta() as RealmMetaType
    return (
        comments.data ?
          <CommentsDisplay comments={comments.data} proposal={proposal}/>  :
        comments.isLoading ?
            <CommentsPulseModal primaryBackground={primaryBackground} secondaryBackground={secondaryBackground} /> :
            <div className="">
                Failed to load comments
            </div>
    )
}