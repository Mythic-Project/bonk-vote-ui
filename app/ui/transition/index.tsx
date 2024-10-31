"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useGetRegistrar } from "@/app/hooks/useVsr"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { useState } from "react"
import Modal from "react-modal"
import { customStyles } from "../style/modal-style"
import TransitionContent from "./content"
import { BN } from "bn.js"

function Transition() {
  const realmMeta = useDaoMeta() as RealmMetaType
  const [modalIsOpen, setIsOpen] = useState(true);

  // Show the popup if the user has some tokens in the default TOR but the DAO is using VSR
  return (
    // voteWeight && voteWeight.selfAmount.isVsr && voteWeight.selfAmount.defaultTokens.gt(new BN(0)) ?
    // <Modal
    //   isOpen={modalIsOpen}
    //   onRequestClose={() => setIsOpen(false)}
    //   style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
    //   contentLabel="Voter Weight"
    //   ariaHideApp={false}
    // >
    //   <TransitionContent closeModal={setIsOpen}/>
    // </Modal> :
    ""
  )
}

export default Transition