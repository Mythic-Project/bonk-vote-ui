"use client"

import { useGetProposal } from "@/app/hooks/useProposal";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { PublicKey } from "@solana/web3.js";
import { GovernanceAccount } from "test-governance-sdk";
import { ProposalDisplay } from "./proposal-display";
import { PulseModal } from "../../animations";
import { useState } from "react";
import { useGetComments } from "@/app/hooks/useComments";

export function Proposal(
    {
        proposal, 
        governance,
        network
    } : 
    {
        proposal: PublicKey, 
        governance: GovernanceAccount, 
        network: string
    }
) {
    const [initialFetch, setInitialFetch] = useState(true)
    const realmMeta = useDaoMeta() as RealmMetaType
    const {data} = useGetProposal(realmMeta.name, proposal, !initialFetch)
    const comments = useGetComments(realmMeta.name, proposal)

    return (
        data ?
            <ProposalDisplay
                proposal={data}
                governance={governance}
                network={network}
                setInitialFetch={setInitialFetch}
                comments={comments}
            /> :
            <PulseModal primaryBackground={realmMeta.primaryBackground}/>
    )
}