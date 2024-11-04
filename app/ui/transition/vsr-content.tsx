"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { ActiveButton } from "../buttons"
import { useState } from "react"
import { useGetVoteRecords } from "@/app/hooks/useVoteRecord"
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"
import { useVsrTransitionTokens } from "@/app/hooks/useVsrTransition"

function VsrTransitionContent({closeModal} : {closeModal: (b: boolean) => void}) {
  const realmMeta = useDaoMeta() as RealmMetaType
  const voteRecords = useGetVoteRecords(realmMeta.name).data
  const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data

  const [errorMsg, setError] = useState("")

  const {
    mutateAsync: transitionTokensFn, 
    isError: transitionTokensFailed, 
    isPending: transitionTokensPending, 
  } = useVsrTransitionTokens(realmMeta.name)

  async function handleSubmit() {
    setError("")
    
    if (!voteRecords) {
      setError("Could not fetch the vote records. Try again.")
      return
    }

    if (tokenOwnerRecord === undefined) {
      setError("Failed to load token owner record. Try again.")
      return
    }

    const x = await transitionTokensFn({
      voteRecords
    })

    console.log(x)
    closeModal(true)
  }

  return (
    <div className="flex flex-col gap-8 items-center my-4">
      <h2 className="text-xl font-bold text-primary-text">Welcome to the new Bonk Governance Experience</h2>
      <div className="text-secondary-text text-[16px] flex flex-col items-center text-center">
        <p className="">We have detected that your voter record is outdated and linked to the previous governance.</p>
        <p className="">Click the button below to close it, claim back tokens and start participating in the new governance</p>
      </div>
      <ActiveButton 
        title={transitionTokensPending ? "Closing..." : "Close Old Voter"}
        mainColor={realmMeta.mainColor}
        actionBackground={realmMeta.actionBackground}
        disabled={transitionTokensPending}
        onClick={handleSubmit}
      />
      {errorMsg || transitionTokensFailed &&
        <div className="text-red-400 text-sm mt-4">
          {errorMsg}
          {transitionTokensFailed && "The closing process failed, please try again."}
        </div>
      }
    </div>
  )
}

export default VsrTransitionContent