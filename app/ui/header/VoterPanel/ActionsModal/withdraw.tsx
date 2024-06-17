'use client'

import { useGetDaoMintData } from "@/app/hooks/useMint";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { VoterWeightType } from "@/app/hooks/useVoterWeight";
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

export function Withdraw(
    {closeModal, voterWeight}:
    {closeModal: () => void, voterWeight: UseQueryResult<VoterWeightType | null, Error>}
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

    const withdrawableAmount = useMemo(() => {
        return voterWeight.data ?
        calculateWithdrawableBalance(voterWeight.data.selfAmount.tokens) :
        [{amount: new BN(0), mint: new PublicKey(realmMeta.tokenMint)}]
    }, [voterWeight.data, realmMeta.tokenMint])

    useEffect(() => {
        if (!daoMintInfo || !withdrawableAmount.length) return

        const el = withdrawableAmount[selectedMint]

        if (el) {
            const amt = calculateBalance(
                el.amount,
                daoMintInfo.find(d => d.address.equals(el.mint))!.decimals
            )
    
            setAmount(amt)
        }
        
    }, [daoMintInfo, selectedMint, withdrawableAmount])

    function setMax() {
        if (!voterWeight.data || !daoMintInfo) return

        const amt = calculateBalance(
            withdrawableAmount[selectedMint].amount,
            daoMintInfo.find(m => m.address.equals(withdrawableAmount[selectedMint].mint))!.decimals
        )
        
        setAmount(amt)
    }

    function handleSubmit() {
        setError("")

        if (!voterWeight.data || !daoMintInfo || !voteRecords) {
            setError("Unable to retrieve token holdings and mint details, try again.")
            return
        }

        const decimals = daoMintInfo.find(m => m.address.equals(withdrawableAmount[selectedMint].mint))!.decimals
        const [base, deci] = amount.split(".")
        const pow = new BN(10).pow(new BN(decimals))
        let baseAmount = new BN(base).mul(pow)

        if (deci) {
            const deciWithPow = deci.padEnd(decimals, "0").substring(0, decimals)
            baseAmount = baseAmount.add(new BN(deciWithPow))
        }

        if (baseAmount.gt(withdrawableAmount[selectedMint].amount)) {
            setError("Insufficient tokens. Try with lower amount.")
            return
        }

        setFinalAmount(baseAmount)
        setWithdrawPage(2)
    }
    
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

                {
                    voterWeight.data && daoMintInfo && withdrawableAmount.length > 1 &&
                    <AddTokensList 
                        setSelectedToken={setSelectedMint} 
                        selectedToken={selectedMint}
                        tokensHolding={
                            withdrawableAmount.map((w => ({
                                balance: w.amount.toString(),
                                mint: w.mint,
                                account: PublicKey.default,
                                decimals: daoMintInfo.find(m => m.address.equals(w.mint))!.decimals
                        })))
                    }/>
                }

                <hr className="border-[1px]w-full mb-6" style={{borderColor: realmMeta.secondaryBackground}} />
                
                <input type="number" placeholder={"0"} className="
                    placeholder:text-placeholder-shade w-full p-3 rounded-lg z-20 
                    border-[1px] mb-2"
                    disabled={voterWeight.data? false : true}
                    style={{backgroundColor: realmMeta.secondaryBackground, borderColor: realmMeta.optionsSelected }}
                    onChange={(e) => setAmount(e.target.value)}
                    value={amount}
                />

                <div className="flex gap-2 text-xs text-secondary-text w-full mb-6">
                    <h4 className="flex gap-1">
                        Balance: {
                            voterWeight.isFetching ?
                                <div>Loading..</div> :
                            voterWeight.data && daoMintInfo && withdrawableAmount.length ? 
                                <Balance holding={{
                                    balance: withdrawableAmount[selectedMint].amount.toString(),
                                    decimals: daoMintInfo.find(m => m.address.equals(withdrawableAmount[selectedMint].mint))!.decimals
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
                            backgroundColor: withdrawableAmount.length && !withdrawableAmount[selectedMint].amount.isZero() ? 
                                realmMeta.mainColor :
                                realmMeta.actionBackground
                            }}
                        vibrant={true}
                        disabled={!voterWeight.data || !withdrawableAmount.length}
                        onClick={handleSubmit}
                    />
                    <StandardButton title="Cancel" onClick={closeModal}/>
                </div>

                <div className="text-red-400 text-sm mt-4">
                    {errorMsg}
                    {/* {addTokensFailed && "Token deposit failed"} */}
                </div>
            </div> :
        withdrawPage === 2 ?
            <ConfirmWithdraw 
                closeModal={closeModal} 
                amount={finalAmount} 
                voteRecords={voteRecords!}
                voterWeight={voterWeight.data!}
                setAmount={setAmount}
                setWithdrawPage={setWithdrawPage}
                selectedMint={withdrawableAmount[selectedMint] ? withdrawableAmount[selectedMint].mint : PublicKey.default}
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