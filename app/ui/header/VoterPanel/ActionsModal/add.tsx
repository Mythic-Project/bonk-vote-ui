'use client'

import { RealmMetaType } from "@/app/hooks/useRealm";
import { TokenHoldingReturnType, useGetTokensHolding } from "@/app/hooks/useToken";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { StandardButton } from "@/app/ui/buttons";
import { Balance, calculateBalance } from "./balance";
import { useState } from "react";
import BN from "bn.js";
import { useAddTokens } from "@/app/hooks/useAddTokens";
import Link from "next/link";
import { UseQueryResult } from "@tanstack/react-query";
import { Spinner } from "@/app/ui/animations";
import { getLink } from "@/app/utils/ui-utils";

export function Add(
    {closeModal, tokensHolding}:
    {closeModal: () => void, tokensHolding: UseQueryResult<TokenHoldingReturnType | null, Error>}
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const [amount, setAmount] = useState("")
    const [errorMsg, setError] = useState("")

    const {
        mutateAsync: addTokensFn, 
        isError: addTokensFailed, 
        isPending: addTokensPending, 
        data: addTokensData
    } = useAddTokens(realmMeta.name)

    function setMax() {
        if (!tokensHolding.data) return
        const amount = calculateBalance(
            new BN(tokensHolding.data.balance),
            tokensHolding.data.decimals
        )

        setAmount(amount)
    }

    async function handleSubmit() {
        setError("")
        
        if (!tokensHolding.data) {
            setError("Unable to retrieve token holdings, try again.")
            return
        }

        const maxAmount = new BN(tokensHolding.data.balance)

        const decimals = tokensHolding.data!.decimals
        const [base, deci] = amount.split(".")
        const pow = new BN(10).pow(new BN(decimals))
        let baseAmount = new BN(base).mul(pow)

        if (deci) {
            const deciWithPow = deci.padEnd(decimals, "0").substring(0, decimals)
            baseAmount = baseAmount.add(new BN(deciWithPow))
        }

        if (baseAmount.gt(maxAmount)) {
            setError("Insufficient tokens. Try with lower amount.")
            return
        }

        await addTokensFn({
            tokenAccount: tokensHolding.data.account,
            amount: baseAmount
        })

        setAmount("")
    }

    return (
        <div className="w-80">

             <h2 className="font-medium text-primary-text mb-4">
                Add tokens to vote on proposals
            </h2>

            <hr className="border-[1px] w-full mb-6" style={{borderColor: realmMeta.secondaryBackground}} />

            <input type="number" placeholder={"0"} className="
                placeholder:text-placeholder-shade w-full p-3 rounded-lg z-20 border-[1px] mb-2"
                style={{backgroundColor: realmMeta.secondaryBackground, borderColor: realmMeta.optionsSelected }}
                disabled={tokensHolding.data? false : true}
                onChange={(e) => setAmount(e.target.value)}
                value={tokensHolding.data ? amount : ""}
            />

            <div className="flex gap-2 text-xs text-secondary-text w-full mb-6">
                <h4 className="flex gap-1">
                    Balance: {
                        tokensHolding.isFetching ?
                            <div>Loading..</div> :
                        tokensHolding.data ? 
                            <Balance holding={tokensHolding.data} /> : 
                            "NIL"
                    }
                    </h4>
                <div 
                    className="cursor-pointer" 
                    onClick={setMax}
                    style={{color: realmMeta.mainColor}}
                >
                    MAX
                </div>
            </div>

            {
                tokensHolding.error &&
                <div className="text-red-500 text-sm mb-6">Failed to fetch the balance, refresh and try again.</div>
            }
            
            <div className="flex gap-4 items-center w-full">
                <StandardButton 
                    title={
                        addTokensPending ? 
                            <span className="flex gap-2 items-center">
                                <Spinner mainColor={realmMeta.mainColor}/>
                                Adding..
                            </span> :
                            "Add Tokens"
                        }                    
                    style={{backgroundColor: tokensHolding.data && !addTokensPending ? realmMeta.mainColor : realmMeta.actionBackground }}
                    vibrant={true}
                    disabled={
                        !tokensHolding.data || addTokensPending ? true : false
                    }
                    onClick={handleSubmit}
                />
                <StandardButton title="Cancel" onClick={closeModal}/>
            </div>

            <div className="text-red-400 text-sm mt-4">
                {errorMsg}
                {addTokensFailed && "Token deposit failed"}
            </div>

            <div className="text-primary-text text-sm mt-6">
                {
                    addTokensData ?
                        <p className="flex gap-2 text-primary-text">
                            Tokens added successfully.
                            <Link 
                                href={getLink(addTokensData, 'tx', realmMeta.network)} 
                                className="text-secondary-text"
                            >
                                View transaction
                            </Link>
                        </p> :
                        ""
                }
            </div>
        </div>
    )
}