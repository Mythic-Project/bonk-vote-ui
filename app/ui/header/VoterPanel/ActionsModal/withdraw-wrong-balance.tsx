"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useGetVoteRecords } from "@/app/hooks/useVoteRecord"
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"
import { useWithdrawWrongDeposit } from "@/app/hooks/useWithdrawWrongDeposit"
import { useDaoMeta } from "@/app/providers/dao-provider"

export default function WithdrawWrongDeposit() {
  const realmMeta = useDaoMeta() as RealmMetaType
  const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
  const voteRecords = useGetVoteRecords(realmMeta.name).data


  const {
    mutateAsync: withdrawTokensFn,
    isPending: withdrawTokensPending,
  } = useWithdrawWrongDeposit(realmMeta.name)

  async function handleSubmit() {

    if (tokenOwnerRecord === undefined) {
      return
    }

    if (!tokenOwnerRecord || !voteRecords) {
      return
    }

    await withdrawTokensFn({voteRecords})
  }

  return (
    <div className="w-full">
      <button
        onClick={handleSubmit}
        disabled={withdrawTokensPending}
      >
        {withdrawTokensPending ? "Withdrawing.." : "Withdraw Wrong Deposit"}
      </button>
    </div>
  )
}