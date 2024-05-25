import { removeZeros } from "@/app/utils/ui-utils";
import BN from "bn.js";

export function calculateBalance(amount: BN, decimals: number) {
    const pow = new BN(10).pow(new BN(decimals))
    const base = amount.div(pow)
    const deci = amount.mod(pow)
    const baseString = base.toString()
    const deciSign = !deci.eq(new BN(0)) ? "." : ""
    const deciString = !deci.eq(new BN(0)) ? deci.toString().padStart(decimals, "0") : ""

    return baseString+deciSign+removeZeros(deciString)
}

export function calculateWithdrawableBalance(amounts: BN[]) {
    return amounts.reduce((a,b) => a.add(b), new BN(0))
}

export function Balance(
    {holding}: {holding: {
        balance: string,
        decimals: number
    }}
) {
    const amount = new BN(holding.balance)
    const balanceString = calculateBalance(amount, holding.decimals)

    return (
        <div className="">
            {balanceString}
        </div>
    )
}