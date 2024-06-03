'use client'

import { IoMdStopwatch } from "react-icons/io"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { GovernanceAccount, ProposalV2 } from "test-governance-sdk"
import { MetaState } from "./meta-components"
import { useGetTokenOwnerRecordForPubkey } from "@/app/hooks/useVoterRecord"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { RealmMetaType } from "@/app/hooks/useRealm"
import { ellipsify, getLink } from "@/app/utils/ui-utils"
import Link from "next/link"
import { useGetCivicIdentity } from "@/app/hooks/useCivicIdentity"
import Image from "next/image"
import ProfileImage from "./profile-image"

dayjs.extend(relativeTime)

export function ProposalMeta(
    {proposal, governance} : {proposal: ProposalV2, governance: GovernanceAccount}
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const creatorTokenOwnerRecord = useGetTokenOwnerRecordForPubkey(realmMeta.name, proposal.tokenOwnerRecord)
    const civicProfile = useGetCivicIdentity(creatorTokenOwnerRecord.data?.governingTokenOwner)

    const voteDuation = governance.config.votingBaseTime * 1000
    const cooldownDuration = governance.config.votingCoolOffTime * 1000

    const votingAt = proposal.votingAt!.toNumber() * 1000
    const votingEndTime = votingAt + voteDuation
    const endTimeWithCoolOff = votingEndTime + cooldownDuration

    let state = Object.keys(proposal.state)[0]

    state = Date.now() > endTimeWithCoolOff && state === "voting" ?
        "Finalizing" : state

    return (
        <div className="flex sm:flex-row flex-col justify-between gap-4">
            <div className="flex gap-3 items-center ">
                {creatorTokenOwnerRecord.data && 
                    <ProfileImage 
                        image={civicProfile.data?.image?.url} 
                        fallbackAddress={creatorTokenOwnerRecord.data.governingTokenOwner}
                        backgroundColor={realmMeta.optionsBackground}
                    />
                }
                <div className="">
                    <div className="text-sm text-primary-text">
                        Created by {
                            creatorTokenOwnerRecord.data ?
                                <Link 
                                    href={getLink(
                                        creatorTokenOwnerRecord.data.governingTokenOwner.toBase58(), 
                                        'account', 
                                        realmMeta.network
                                    )}
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    passHref
                                >
                                    {civicProfile.data?.name?.value ??
                                    ellipsify(creatorTokenOwnerRecord.data.governingTokenOwner.toBase58())}
                                </Link> :
                            creatorTokenOwnerRecord.isFetching ?
                                "Loading.." :
                                "..."
                        }
                    </div>
                    <div className="text-xs text-secondary-text">
                        {dayjs(votingAt).fromNow()}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {
                    <div className=" flex items-center gap-1 text-xs py-2 px-4 rounded-2xl" style={{backgroundColor: realmMeta.secondaryBackground}}>
                        <IoMdStopwatch className="text-[14px]"/>
                        {dayjs(votingEndTime).fromNow()}
                    </div>
                }
                
                <div className="flex items-center gap-2 text-xs py-2 px-4 rounded-2xl" style={{backgroundColor: realmMeta.secondaryBackground}}>
                    <MetaState state={proposal.state} voteTimeExpired={Date.now() > votingEndTime}/>
                    {state[0].toUpperCase()+state.slice(1)}
                </div>
            </div>
        </div>
    )
}