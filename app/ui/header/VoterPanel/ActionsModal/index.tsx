'use client'

import { StandardButton } from "../../../buttons";
import { Add } from "./add";
import { Withdraw } from "./withdraw";
import { Delegate } from "./delegate";
import { useGetTokensHolding } from "@/app/hooks/useToken";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";

type ActionsModalProps = {
    closeModal: () => void, 
    action: number, 
    setAction: (action: number) => void,
}

export function ActionsModal(
    {
        closeModal, 
        action, 
        setAction,
    }:
    ActionsModalProps
) {
    const realmMeta = useDaoMeta() as RealmMetaType
    const tokensHolding = useGetTokensHolding(realmMeta.name)

    return (
        <div className="flex flex-col gap-2 items-center px-4 pt-4">
            <div className="mb-2 flex items-start w-full">
                <StandardButton 
                    vibrant={true}
                    title={action === 1 ? "Add" : action === 2 ? "Withdraw" : "Delegate"}
                    style={{backgroundColor: realmMeta.actionBackground }}
                />
            </div>
           {
                action === 1 ?
                    <Add closeModal={closeModal} tokensHolding={tokensHolding}/> :
                action === 2 ?
                    <Withdraw closeModal={closeModal} /> :
                action === 3 ?
                    <Delegate closeModal={closeModal} /> :
                    ""
           }
        </div>
    )
}