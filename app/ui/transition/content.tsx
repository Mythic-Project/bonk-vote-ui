"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { ActiveButton } from "../buttons"
import { useTransitionTokens } from "@/app/hooks/useTransitionTokens"
import { useGetVoterWeight } from "@/app/hooks/useVoterWeight"
import { useState } from "react"

function TransitionContent({closeModal} : {closeModal: (b: boolean) => void}) {
  const realmMeta = useDaoMeta() as RealmMetaType
  const voterWeight = useGetVoterWeight(realmMeta.name).data
  
  const [errorMsg, setError] = useState("")

  const {
    mutateAsync: transitionTokensFn, 
    isError: transitionTokensFailed, 
    isPending: transitionTokensPending, 
  } = useTransitionTokens(realmMeta.name)

  async function handleSubmit() {
    if (!voterWeight) {
      setError("Could not fetch the voter weight. Try again.")
      return
    }

    await transitionTokensFn({
      amount: voterWeight.selfAmount.defaultTokens
    })

    closeModal(true)
  }

  return (
    <div className="flex flex-col gap-8 items-center my-4">
      <h2 className="text-xl font-bold text-primary-text">Welcome to the new Governance Experience</h2>
      <div className="text-secondary-text text-[16px] flex flex-col items-center text-center">
        <p className="">The DAO has transitioned to a brand-new Governance.</p>
        <p className="">
          This means that you will need to update your voting power. But 
          worry not, we have made it super easy for you.
        </p>
        <p className="">Just click the button below and start participating in the newer version</p>
      </div>
      <ActiveButton 
        title={transitionTokensPending ? "Updating..." : "Update Voting Power"}
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