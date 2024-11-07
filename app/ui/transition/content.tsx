"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { ActiveButton } from "../buttons"
import { useTransitionTokens } from "@/app/hooks/useTransitionTokens"
import { useState } from "react"
import { useGetVoteRecords } from "@/app/hooks/useVoteRecord"
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"
import { useGetTokensHolding } from "@/app/hooks/useToken"
import { useGetDaoMintData } from "@/app/hooks/useMint"
import FormatBalance from "../header/VoterPanel/format-balance"
import { BN } from "bn.js"

function TransitionContent({closeModal} : {closeModal: (b: boolean) => void}) {
  const realmMeta = useDaoMeta() as RealmMetaType
  const voteRecords = useGetVoteRecords(realmMeta.name).data
  const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
  const tokenHolding = useGetTokensHolding(realmMeta.name).data

  const [errorMsg, setError] = useState("")
  const [depositTokens, setDepositTokens] = useState(false)

  const {
    mutateAsync: transitionTokensFn, 
    isError: transitionTokensFailed, 
    isPending: transitionTokensPending, 
  } = useTransitionTokens(realmMeta.name)

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

    await transitionTokensFn({
      amount: depositTokens && tokenHolding?.length ? new BN(tokenHolding[0].balance) : undefined,
      voteRecords
    })

    closeModal(true)
  }

  return (
    <div className="flex flex-col gap-8 items-center my-4">
      <h2 className="text-xl font-bold text-primary-text">Welcome to the new Bonk Governance Experience</h2>
      <div className="text-secondary-text text-[16px] flex flex-col items-center text-center">
        <p className="">It appears that your voting profile configuration is incomplete</p>
        <p className="">Click the button below to start participating in the DAO</p>
      </div>
      <ActiveButton 
        title={transitionTokensPending ? "Updating..." : "Completing Voting Profile"}
        mainColor={realmMeta.mainColor}
        actionBackground={realmMeta.actionBackground}
        disabled={transitionTokensPending}
        onClick={handleSubmit}
      />
      {errorMsg || transitionTokensFailed &&
        <div className="text-red-400 text-sm mt-4">
          {errorMsg}
          {transitionTokensFailed && "The update process failed, please try again."}
        </div>
      }
    </div>
  )
}

export default TransitionContent