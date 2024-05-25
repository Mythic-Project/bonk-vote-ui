'use client'

import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import { FC, ReactNode } from "react";
import { useDaoMeta } from "./dao-provider";
import dynamic from "next/dynamic";

const WalletModalProviderDynamic = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletModalProvider,
    { ssr: false }
);

export const WalletContextProvider: FC<{children: ReactNode}> = ({children}) => {
    const daoMeta = useDaoMeta()

    const endpoint = daoMeta?.network === "mainnet" ?
        process.env.NEXT_PUBLIC_MAINNET_RPC as string :
        process.env.NEXT_PUBLIC_DEVNET_RPC as string

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={[]} autoConnect={true}>
                <WalletModalProviderDynamic>
                    {children}
                </WalletModalProviderDynamic>
            </WalletProvider>
        </ConnectionProvider>
    )
}