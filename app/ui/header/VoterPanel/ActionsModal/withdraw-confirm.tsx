'use client'

import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { StandardButton } from "@/app/ui/buttons";
import { useState } from "react";
import { MdOutlineHowToVote } from "react-icons/md";
import BN from "bn.js";
import { useWithdrawTokens } from "@/app/hooks/useWithdrawTokens";
import Link from "next/link";
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import { VoteRecordWithGov } from "@/app/hooks/useVoteRecord";
import { VoterWeightType } from "@/app/hooks/useVoterWeight";
import { Spinner } from "@/app/ui/animations";
import { getLink, txDropErrorMsg } from "@/app/utils/ui-utils";
import { PublicKey } from "@solana/web3.js";

export function ConfirmWithdraw(
    {
        closeModal, 
        amount,
        setAmount,
        setWithdrawPage,
        voteRecords,
        voterWeight,
        selectedMint
    } :
    {
        closeModal: () => void,
        amount: BN, 
        setAmount: (s: string) => void,
        setWithdrawPage: (n: 1 | 2 | 3) => void,
        voteRecords: VoteRecordWithGov[],
        voterWeight: VoterWeightType,
        selectedMint: PublicKey
    }
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data

    const [errorMsg, setError] = useState("")
    const {
        mutateAsync: withdrawTokensFn,
        isError: withdrawTokensFailed,
        error: withdrawTokensError,
        isPending: withdrawTokensPending,
        data: withdrawTokensData
    } = useWithdrawTokens(realmMeta.name)

    async function handleSubmit() {
        setError("")

        if (tokenOwnerRecord === undefined) {
            setError("Failed to load token owner record. Try again.")
            return
        }

        if (!tokenOwnerRecord) {
            setError("The Token Owner Record does not exist.")
            return
        }

        await withdrawTokensFn({amount, tokenOwnerRecord, voteRecords, voterWeight, depositMint: selectedMint})
        setWithdrawPage(3)
    }

    return (
        <div className="w-80 flex flex-col items-center text-center gap-4 mb-4">
            <MdOutlineHowToVote className="text-placeholder-shade text-7xl"/>

            <h2 className="font-medium text-primary-text">
                Withdrawing your tokens to your wallet will also remove your
                active votes 
            </h2>

            <p className="text-secondary-text w-full text-xs">
                If you remove your tokens your votes on active proposals will be removed
            </p>

            <hr className="border-[1px] w-full" style={{borderColor: realmMeta.secondaryBackground}}/>

            <div className="flex gap-4 w-full justify-center">
                <StandardButton 
                    title={
                        withdrawTokensPending ?
                            <span className="flex gap-2 items-center">
                                <Spinner mainColor={realmMeta.mainColor} />
                                Withdrawing..
                            </span> :
                            "Withdraw Tokens" 
                    }
                    style={{backgroundColor: withdrawTokensPending ? realmMeta.actionBackground : realmMeta.mainColor}}
                    disabled={withdrawTokensPending}
                    vibrant={true}
                    onClick={handleSubmit}
                />
                <StandardButton title="Cancel" onClick={closeModal}/>
            </div>

            {
                errorMsg || withdrawTokensFailed ?
                <div className="text-red-400 text-sm">
                    {errorMsg}
                    {withdrawTokensFailed && txDropErrorMsg(withdrawTokensError.message)}
                </div> :
                ""
            }
            
            {
                withdrawTokensData ?
                <div className="text-primary-text text-sm">
                    <p className="text-primary-text flex flex-col ">
                        Tokens withdrawn successfully
                        <Link 
                            href={getLink(withdrawTokensData, 'tx', realmMeta.network)} 
                            className="text-secondary-text"
                        >
                            View transaction
                        </Link>
                    </p>
                </div> :
                ""
            }
        </div>
    )
}