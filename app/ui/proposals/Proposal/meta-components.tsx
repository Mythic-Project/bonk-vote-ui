import { PublicKey } from "@solana/web3.js"
import clsx from "clsx"
import Link from "next/link"
import { FaExternalLinkAlt } from "react-icons/fa"

export function MetaState(
    {state, voteTimeExpired}: 
    {state: any, voteTimeExpired: boolean}
) {
    return (
        <div className={clsx({
            "bg-green-400": state.voting && !voteTimeExpired,
            "bg-[#0288D1]": state.voting && voteTimeExpired || state.executing,
            "bg-green-700": state.completed || state.succeeded,
            "bg-red-500": state.defeated,
            "bg-yellow-400": state.cancelled
        }, "w-[6px] h-[6px] rounded-full")}
        ></div>
    )
}

export function RealmsLink(
    {proposal, realm, network} : {proposal: PublicKey, realm: PublicKey, network: string}
) {
    const cluster = network === "devnet" ? "?cluster=devnet" : ""

    return (
        <Link
            href={`https://app.realms.today/dao/${realm}/proposal/${proposal}${cluster}`}
            target="_blank" 
            rel="noopener noreferrer" 
            passHref
            className="text-secondary-text text-sm"
        >
            <FaExternalLinkAlt />
        </Link>
    )
}