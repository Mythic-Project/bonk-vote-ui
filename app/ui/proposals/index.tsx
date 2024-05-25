'use client'

import { Heading } from "../headings";
import { SearchBar } from "./search-bar";
import { useGetProposals } from "@/app/hooks/useProposal";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { PulseModal } from "../animations";
import { useGetGovernanceAccounts } from "@/app/hooks/useGovernance";
import { useEffect, useState } from "react";
import { ProposalV2 } from "test-governance-sdk";
import { Proposal } from "./Proposal";

export function Proposals() {
    const [activeProposals, setActiveProposals] = useState<ProposalV2[]>([])
    const [showLoadButton, setShowLoadButton] = useState(true)

    const daoMeta = useDaoMeta()
    const governances = useGetGovernanceAccounts(daoMeta!.name)
    const proposals = useGetProposals(daoMeta!.name)
    
    useEffect(() => {
        const activeProps = proposals.data ?
            proposals.data.filter(proposal => proposal.state.voting) :
            []

        setActiveProposals(activeProps)
    }, [proposals.data])

    function loadProposals() {
        if (!proposals.data) return

        const remainingProposals = proposals.data.filter(proposal => !activeProposals.some(
            prop => prop.publicKey.equals(proposal.publicKey)
        ))
        
        const newActiveProps = [...activeProposals,...remainingProposals.slice(0,2)]
        setActiveProposals(newActiveProps)
        
        if (remainingProposals.length < 2) {
            setShowLoadButton(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-[722px] mt-8">
            <div className="flex justify-between items-center">
                <Heading title="Proposals" />
                <SearchBar />
            </div>
            {
                proposals.data === undefined || proposals.isFetching ?
                    <PulseModal primaryBackground={daoMeta!.primaryBackground}/> :
                proposals.data ?
                    <div className="flex flex-col gap-8">
                        {
                         activeProposals.length ? 
                            activeProposals.map(proposal => (
                                <Proposal
                                    proposal={proposal.publicKey} 
                                    key={proposal.publicKey.toBase58()}
                                    governance={
                                        governances.data!.find(
                                            gov => gov.publicKey.equals(proposal.governance)
                                    )!}
                                    network={daoMeta!.network}
                                />
                            )) :
                            "No Active Proposals"
                        }
                        {
                            showLoadButton && 
                            <div className="w-full flex flex-col items-center">
                                <p className="w-60 text-center 
                                    py-4 cursor-pointer text-secondary-text"
                                    style={{backgroundColor: daoMeta!.primaryBackground}}
                                    onClick={loadProposals}
                                >
                                    Load more Proposals
                                </p>
                            </div>
                        }
                    </div> :
                "Failed to fetch the proposals."
            }
        </div>
    )
}