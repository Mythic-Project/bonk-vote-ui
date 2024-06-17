'use client'

import { useDelegateTokens } from "@/app/hooks/useDelegateTokens";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import { VoterWeightType } from "@/app/hooks/useVoterWeight";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { StandardButton } from "@/app/ui/buttons";
import { Spinner } from "@/app/ui/animations";
import { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ellipsify, getLink, txDropErrorMsg } from "@/app/utils/ui-utils";
import { useConnection } from "@solana/wallet-adapter-react";

export function Delegate(
    {closeModal, voterWeight}:
    {closeModal: () => void, voterWeight: UseQueryResult<VoterWeightType | null, Error>}
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name).data
    const {connection} = useConnection()

    const [address, setAddress] = useState("")
    const [errorMsg, setError] = useState("")

    const {
        mutateAsync: delegateTokensFn,
        data: delegateTokensData,
        isPending: delegateTokensPending,
        isError: delegateTokensFailed,
        error: delegateTokensError,
    } = useDelegateTokens(realmMeta.name)

    async function handleSubmit(addDelegate: boolean) {
        setError("")

        if (tokenOwnerRecord === undefined) {
            setError("Failed to load token owner record. Try again.")
            return
        }

        if (!tokenOwnerRecord) {
            setError("The Token Owner Record does not exist.")
            return
        }

        let delegate: string | null = null
        
        if (addDelegate) {
            delegate = address
        }
        
        await delegateTokensFn({newDelegate: delegate, addDelegateTx: addDelegate, tokenOwnerRecord})
        setAddress("")
    }

    return (
        <div className="w-80">
             <h2 className="font-medium text-primary-text mb-2">
                Delegate your tokens
            </h2>
            <p className="text-secondary-text text-sm mb-4">
                The delegate can vote on your behalf. You can remove delegate at any time.
            </p>
            {
                voterWeight.data?.selfAmount.delegate &&
                    <div className="text-secondary-text text-sm mb-4">
                        <div className="flex gap-2 items-center">
                            Current Delegate:
                            <button 
                                className="text-red-500 cursor-pointer"
                                onClick={() => handleSubmit(false)}
                                disabled={delegateTokensPending}
                            >
                                Remove
                            </button>
                        </div>
                        <Link href={getLink(voterWeight.data.selfAmount.delegate.toBase58(), "account", realmMeta.network)}>
                        <span className="text-primary-text text-[12px] cursor-pointer">
                            {ellipsify(voterWeight.data.selfAmount.delegate.toBase58(),16)}
                        </span>
                        </Link>
                    </div>
            }
            
            <hr className="border-[1px] w-full mb-4" style={{borderColor: realmMeta.secondaryBackground}}/>
            <h4 className="text-primary-text text-sm mb-2">Address</h4>
            <input 
                type="text" 
                placeholder={"kruHL...gvZC"} 
                className=" placeholder:text-placeholder-shade 
                    w-full p-3 rounded-lg z-20 border-[1px] mb-4"
                value={address}
                style={{backgroundColor: realmMeta.secondaryBackground, borderColor: realmMeta.optionsSelected }}
                disabled={!voterWeight.data}
                onChange={(e) => setAddress(e.target.value)}
            />

            <div className="flex gap-4 items-center w-full">
                <StandardButton 
                    title={
                        delegateTokensPending ?
                            <span className="flex gap-2 items-center">
                                <Spinner mainColor={realmMeta.mainColor} />
                                Delegating..
                            </span> :
                            "Delegate Tokens" 
                    }
                    style={{backgroundColor: delegateTokensPending ? realmMeta.actionBackground : realmMeta.mainColor}}
                    vibrant={true}
                    onClick={() => handleSubmit(true)}
                />
                <StandardButton title="Cancel" onClick={closeModal}/>
            </div>

            {
                errorMsg || delegateTokensFailed ?
                <div className="text-red-400 text-sm mt-4">
                    {errorMsg}
                    {delegateTokensFailed && txDropErrorMsg(delegateTokensError.message)}
                </div> : 
                ""
            }
            {
                delegateTokensData &&
                <div className="text-primary-text text-sm mt-4 text-center">
                    <p className="text-primary-text flex flex-col">
                        Transaction Successful.
                        <Link 
                            href={getLink(delegateTokensData, 'tx', realmMeta.network)} 
                            className="text-secondary-text"
                        >
                            View transaction
                        </Link>
                    </p>
                </div>
            }
        </div>
    )
}