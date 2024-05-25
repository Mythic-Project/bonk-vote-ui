'use client'

import { useGetProposalTransaction } from "@/app/hooks/useProposalTransaction";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import Link from "next/link";
import { MdOutlineWarning } from "react-icons/md";
import { ProposalV2 } from "test-governance-sdk";


export function TransactionWarning(
    {proposal} : {proposal: ProposalV2}
) {
    const {name: realmName, realmId: realm, optionsDark} = useDaoMeta() as RealmMetaType
    const proposalTransaction = useGetProposalTransaction(realmName, proposal.publicKey).data

    return (
        proposalTransaction ?
            <div className="w-full p-4 flex gap-2 border-[1px] border-[#DF6A70] rounded-md mb-4
                text-xs sm-items-center"
                style={{backgroundColor: optionsDark}}
            >
                <MdOutlineWarning className="text-[#DF6A70] text-xl sm:text-lg"/>
                <div className="flex gap-1 flex-col sm:flex-row">
                    <div className="">
                        <span className="text-primary-text">WARNING: </span>
                        <span className="text-secondary-text">This proposal triggers instructions if passed.</span>
                    </div>
                    
                    <Link
                        href={`https://app.realms.today/dao/${realm}/proposal/${proposal.publicKey.toBase58()}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        passHref
                    >
                        <span className="text-primary-text underline">
                            Click here to see more details
                        </span>
                    </Link>
                </div>
            </div> :
            ""
    )
}