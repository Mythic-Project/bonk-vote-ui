'use client'

import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function WalletButton() {
    const {publicKey} = useWallet()
    const daoMeta = useDaoMeta() as RealmMetaType

    return (
        <div>
            <WalletMultiButton style={{
                background: daoMeta.primaryBackground, color: "white", fontWeight: 400, fontSize: "13px", border: 0
            }}>
                    {publicKey ? 
                        undefined : 
                        "Connect Wallet"
                    }
                </WalletMultiButton>
        </div>   
    )
}

export default WalletButton