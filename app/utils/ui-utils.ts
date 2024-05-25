import { ChatMessage } from "test-governance-sdk"

export function removeZeros(numString: string) {
    const numArray = numString.split("").reverse()
    let run = true

    while (run) {
        if (numArray[0] === "0") {
            numArray.shift()
        } else {
            run = false
        }
    }

    return numArray.reverse().join("")
}

export function ellipsify(str: string, len = 4) {
    if (str.length > 30) {
      return (
        str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
      );
    }
    return str;
}

export function getLink(str: string, type: 'tx' | 'account', network: string) {
    return `https://solscan.io/${type}/${str}/${network === "devnet" ? "?cluster=devnet" : ""}`
}

export function commentsCount(comments: ChatMessage[]) {
    return comments.filter(c => c.body.text !== undefined).length
}

export function txDropErrorMsg(error: string) {
    try {
        const errorObj = JSON.parse(error)

        if (errorObj.signature) {
            return "The transaction failed to confirm, please try again."
        } else {
            return error
        }
    } catch {
        return error
    }
}