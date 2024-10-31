import { removeZeros } from "@/app/utils/ui-utils";
import { PublicKey } from "@solana/web3.js";
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

export function calculateWithdrawableBalance(amounts: {mint: PublicKey, amount: BN}[]) {
    const balances = []

    for (const amount of amounts) {
        const elExists = balances.findIndex(b => b.mint.equals(amount.mint))

        if (elExists === -1) {
            balances.push({
                mint: amount.mint,
                amount: amount.amount
            })
        } else {
            balances[elExists].amount = balances[elExists].amount.add(amount.amount)
        }
    }

    return balances
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