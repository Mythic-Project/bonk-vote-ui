'use client'

import { useState } from "react";
import { customStyles } from "../../style/modal-style";
import VoterWeight from "./voter-weight"
import Modal from "react-modal"
import { ActiveButton, StandardButton } from "../../buttons";
import { ActionsModal } from "./ActionsModal";
import { useGetVoterWeight } from "@/app/hooks/useVoterWeight";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { RealmMetaType } from "@/app/hooks/useRealm";
import { useGetTokensHolding } from "@/app/hooks/useToken";
import { BN } from "bn.js";

function VoterPanel() {
    const realmMeta = useDaoMeta() as RealmMetaType
    const voterWeight = useGetVoterWeight(realmMeta.name)
    const [modalIsOpen, setIsOpen] = useState(false);

    const tokensHoldings = useGetTokensHolding(realmMeta.name)

    const activeBalance = tokensHoldings.data ? 
        tokensHoldings.data.find(holding => holding && new BN(holding.balance).gt(new BN(0))) :
        null

    // 1 for Add, 2 for Withdraw, 3 for Delegate
    const [selectedAction, setSelectedAction] = useState<(number)>(1)

    function handleOpenModal(action: number) {
        setSelectedAction(action)
        setIsOpen(true)
    }

    return (
        <div className="w-full flex sm:flex-row flex-col 
            justify-between p-4 sm:items-center rounded-lg gap-3"
            style={{background: realmMeta.primaryBackgroundShade ?? realmMeta.primaryBackground}}
        >
            <VoterWeight />
            <div className="flex gap-4 items-center">
                <ActiveButton 
                    title="Add" 
                    onClick={() => handleOpenModal(1)} 
                    mainColor={
                        activeBalance ?
                            realmMeta.mainColor :
                            realmMeta.actionBackground
                    }
                    actionBackground={realmMeta.actionBackground}
                />
                <StandardButton title="Withdraw" onClick={() => handleOpenModal(2)}/>
                <StandardButton title="Delegate" onClick={() => handleOpenModal(3)}/>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setIsOpen(false)}
                style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
                contentLabel="Voter Weight"
                ariaHideApp={false}
            >
                <ActionsModal 
                    closeModal={() => setIsOpen(false)} 
                    action={selectedAction} 
                    setAction={setSelectedAction}
                    voterWeight={voterWeight}
                />
            </Modal>
        </div>
    )
}

export default VoterPanel