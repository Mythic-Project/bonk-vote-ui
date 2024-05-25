'use client'

import { StandardButton } from "../../../buttons";
import { Add } from "./add";
import { Withdraw } from "./withdraw";
import { Delegate } from "./delegate";
import { useGetTokensHolding } from "@/app/hooks/useToken";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { VoterWeightType } from "@/app/hooks/useVoterWeight";
import { UseQueryResult } from "@tanstack/react-query";

type ActionsModalProps = {
    closeModal: () => void, 
    action: number, 
    setAction: (action: number) => void,
    voterWeight: UseQueryResult<VoterWeightType | null, Error>
}

export function ActionsModal(
    {
        closeModal, 
        action, 
        setAction,
        voterWeight
    }:
    ActionsModalProps
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const tokensHolding = useGetTokensHolding(realmMeta.name)

    return (
        <div className="flex flex-col gap-2 items-center p-4">
            <div className="flex gap-8 items-center mb-4">
                <StandardButton title="Add" onClick={() => setAction(1)} 
                    style={action === 1 ? {backgroundColor: realmMeta.actionBackground } : undefined}
                />
                <StandardButton title="Withdraw" onClick={() => setAction(2)} 
                    style={action === 2 ? {backgroundColor: realmMeta.actionBackground } : undefined}
                />
                <StandardButton title="Delegate" onClick={() => setAction(3)} 
                    style={action === 3 ? {backgroundColor: realmMeta.actionBackground } : undefined}
                />
            </div>
           {
                action === 1 ?
                    <Add closeModal={closeModal} tokensHolding={tokensHolding}/> :
                action === 2 ?
                    <Withdraw closeModal={closeModal} voterWeight={voterWeight}/> :
                action === 3 ?
                    <Delegate closeModal={closeModal} voterWeight={voterWeight}/> :
                    ""
           }
        </div>
    )
}