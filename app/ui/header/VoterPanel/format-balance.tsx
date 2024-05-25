import { removeZeros } from "@/app/utils/ui-utils"
import BN from "bn.js"

type FormatBalanceProps = {
    decimals: number | undefined,
    weight: BN
}

function FormatBalance({
    decimals,
    weight
}: FormatBalanceProps
) {
    const pow = decimals ? new BN(10).pow(new BN(decimals)) : new BN(1)
    const base = weight.div(pow)
    const decis = weight.mod(pow)
    const decisString = decimals ? decis.toString().padStart(decimals, "0") : decis.toString()

    return (
        <span>
            {base.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            {decis.toNumber() !== 0 && "."}
            {removeZeros(decisString)}
        </span>
    )
}

export function formatOptionVotes(num: BN, decimals = 0) {
    if (num.eq(new BN(0))) return "0"
    
    const numStr: string = num.toString()
    const numStrLen = numStr.length
    const divisionIdx = numStrLen-decimals
    const numStrWithDecimals = numStr.substring(0, divisionIdx)+"."+numStr.substring(divisionIdx, numStrLen)

    const parsedNum = parseFloat(numStrWithDecimals)

    return Intl.NumberFormat('en-US', {
        minimumFractionDigits: parsedNum > 1 ? 3 : 9,
        notation: "compact",
    }).format(parsedNum)
}

export default FormatBalance