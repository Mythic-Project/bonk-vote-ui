'use client'

import { useGetDaoMintData } from "@/app/hooks/useMint";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { StandardButton } from "@/app/ui/buttons";
import { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Balance, calculateBalance, calculateWithdrawableBalance } from "./balance";
import BN from "bn.js";
import { ConfirmWithdraw } from "./withdraw-confirm";
import { useGetVoteRecords } from "@/app/hooks/useVoteRecord";
import { PublicKey } from "@solana/web3.js";
import AddTokensList from "./add-tokens-list";
import WithdrawFinalize from "./withdraw-finalize";
import { useClaimSol } from "@/app/hooks/useClaimSol";
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord";
import Link from "next/link";
import { getLink } from "@/app/utils/ui-utils";

export function Withdraw(
    {closeModal}:
    {closeModal: () => void}
) {
    // 1 for Withdraw Form, 2 for Withdrawal confirmation, 3 for Withdrawal Finalisation
    const [withdrawPage, setWithdrawPage] = useState<1 | 2 | 3>(1)
    const [errorMsg, setError] = useState("")
    const [amount, setAmount] = useState("")
    const [finalAmount, setFinalAmount] = useState<BN>(new BN(0))
    const [selectedMint, setSelectedMint] = useState(0)

    const realmMeta = useDaoMeta() as RealmMetaType
    const daoMintInfo = useGetDaoMintData(realmMeta.name).data
    const voteRecords = useGetVoteRecords(realmMeta.name).data

    const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name)

    // const {
    //     mutateAsync: claimSolFn,
    //     isError: claimSolFailed,
    //     error: claimSolError,
    //     isPending: claimSolPending,
    //     data: claimSolData
    // } = useClaimSol(realmMeta.name)

    const withdrawableAmount = useMemo(() => {
        return tokenOwnerRecord.data?.tokenVoter ?
            tokenOwnerRecord.data.tokenVoter.voterWeight :
            new BN(0)
    }, [tokenOwnerRecord])

    // useEffect(() => {
    //     if (!daoMintInfo || !withdrawableAmount.length) return

    //     const el = withdrawableAmount[selectedMint]

    //     if (el) {
    //         const amt = calculateBalance(
    //             el.amount,
    //             daoMintInfo.find(d => d.address.equals(el.mint))!.decimals
    //         )
    
    //         setAmount(amt)
    //     }
        
    // }, [daoMintInfo, selectedMint, withdrawableAmount])

    function setMax() {
        if (!tokenOwnerRecord.data || !daoMintInfo) return

        const amt = calculateBalance(
            withdrawableAmount,
            daoMintInfo[0].decimals
        )
        setAmount(amt)
    }

    function handleSubmit() {
        setError("")

        if (!tokenOwnerRecord.data || !daoMintInfo || !voteRecords) {
            setError("Unable to retrieve token holdings and mint details, try again.")
            return
        }

        const decimals = daoMintInfo[0].decimals
        const [base, deci] = amount.split(".")
        const pow = new BN(10).pow(new BN(decimals))
        let baseAmount = new BN(base).mul(pow)

        if (deci) {
            const deciWithPow = deci.padEnd(decimals, "0").substring(0, decimals)
            baseAmount = baseAmount.add(new BN(deciWithPow))
        }

        if (baseAmount.eq(new BN(0))) {
            setError("Select amount greater than 0.")
            return
        }

        if (baseAmount.gt(withdrawableAmount)) {
            setError("Insufficient tokens. Try with lower amount.")
            return
        }

        setFinalAmount(baseAmount)
        setWithdrawPage(2)
    }

    // function claimRent() {
    //     setError("")

    //     if (claimSolPending) {
    //         return
    //     }

    //     if (!voterWeight.data || !daoMintInfo || !voteRecords) return

    //     if (tokenOwnerRecord === undefined) {
    //         setError("Failed to load token owner record. Try again.")
    //         return
    //     }

    //     if (!tokenOwnerRecord) {
    //         setError("The Token Owner Record does not exist.")
    //         return
    //     }

    //     claimSolFn({
    //         tokenOwnerRecord,
    //         voteRecords
    //     })
    // }
    
    return (
        withdrawPage === 1 ?
            <div className="w-80">
                    <h2 className="font-medium text-primary-text mb-4">
                    Withdraw Tokens to wallet
                </h2>
                <p className="text-secondary-text w-full text-sm mb-4">
                    <span className="text-primary-text">WARNING: </span>
                    If you remove your tokens your votes on active proposals will be removed
                </p>

                <hr className="border-[1px]w-full mb-6" style={{borderColor: realmMeta.secondaryBackground}} />
                
                <input type="number" placeholder={"0"} className="
                    placeholder:text-placeholder-shade w-full p-3 rounded-lg z-20 
                    border-[1px] mb-2"
                    disabled={tokenOwnerRecord ? false : true}
                    style={{backgroundColor: realmMeta.secondaryBackground, borderColor: realmMeta.optionsSelected }}
                    onChange={(e) => setAmount(e.target.value)}
                    value={amount}
                />

                <div className="flex gap-2 text-xs text-secondary-text w-full mb-6">
                    <h4 className="flex gap-1">
                        Balance: {
                            tokenOwnerRecord.isFetching ?
                                <div>Loading..</div> :
                            tokenOwnerRecord.data && daoMintInfo && withdrawableAmount.gt(new BN(0)) ? 
                                <Balance holding={{
                                    balance: withdrawableAmount.toString(),
                                    decimals: daoMintInfo[0].decimals
                                }} /> : 
                                "Loading.."
                        }
                    </h4>
                    <div className="cursor-pointer" style={{color: realmMeta.mainColor}} onClick={setMax}>MAX</div>
                </div>
                <div className="flex gap-4 items-center w-full">
                    <StandardButton 
                        title="Withdraw Tokens" 
                        style={{
                            backgroundColor: withdrawableAmount.gt(new BN(0)) ? 
                                realmMeta.mainColor :
                                realmMeta.actionBackground
                            }}
                        vibrant={true}
                        disabled={!tokenOwnerRecord.data || !withdrawableAmount.gt(new BN(0))}
                        onClick={handleSubmit}
                    />
                    <StandardButton title="Cancel" onClick={closeModal}/>
                </div>
            </div> :
        withdrawPage === 2 ?
            <ConfirmWithdraw 
                closeModal={closeModal} 
                amount={finalAmount} 
                voteRecords={voteRecords!}
                setAmount={setAmount}
                setWithdrawPage={setWithdrawPage}
            /> :
        withdrawPage === 3 ?
            <WithdrawFinalize 
                borderColor={realmMeta.actionBackground}
                buttonColor={realmMeta.mainColor}
                closeModal={closeModal}
            /> :
            ""
    )
}