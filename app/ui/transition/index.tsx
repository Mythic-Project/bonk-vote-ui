"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { useGetRegistrar, useGetVsrVoter } from "@/app/hooks/useVsr"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { useState } from "react"
import Modal from "react-modal"
import { customStyles } from "../style/modal-style"
import TransitionContent from "./content"
import { BN } from "bn.js"
import { useGetTokenOwnerRecord } from "@/app/hooks/useVoterRecord"
import { useWallet } from "@solana/wallet-adapter-react"
import VsrTransitionContent from "./vsr-content"

function Transition() {
  const realmMeta = useDaoMeta() as RealmMetaType;
  const {publicKey} = useWallet();
  const tokenOwnerRecord = useGetTokenOwnerRecord(realmMeta.name);
  const vsrRecord = useGetVsrVoter(realmMeta.name);

  const [modalIsOpen, setIsOpen] = useState(true);

  // Show the popup if the user does not have the plugin properly configured.
  return (
    vsrRecord.isFetched && publicKey ?
      vsrRecord.data ?
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setIsOpen(false)}
          style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
          contentLabel="Voter Weight"
          ariaHideApp={false}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={false}
        >
          <VsrTransitionContent closeModal={setIsOpen} />
        </Modal> :
      tokenOwnerRecord.isFetched ?
        tokenOwnerRecord.data && tokenOwnerRecord.data.bonkVoterExists && tokenOwnerRecord.data.tokenVoter ?
          "" :
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setIsOpen(false)}
            style={customStyles(realmMeta.primaryBackground, realmMeta.primaryBackgroundShade)}
            contentLabel="Voter Weight"
            ariaHideApp={false}
            shouldCloseOnOverlayClick={false}
          >
            <TransitionContent closeModal={setIsOpen} />
          </Modal>
        : "" :
      ""
  )
}

export default Transition