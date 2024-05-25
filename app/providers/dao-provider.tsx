'use client'

import {ReactNode, createContext, useContext } from "react";
import { useParams } from "next/navigation";
import { RealmMetaType, useGetRealmMeta } from "../hooks/useRealm";

const DaoContext = createContext<RealmMetaType | undefined>({} as RealmMetaType);

export const useDaoMeta = () => useContext(DaoContext);

export const ClusterProvider = ({children}: {children: ReactNode}) => {
    const params = useParams()
    const daoName = params.dao as string
    const daoMeta = useGetRealmMeta(daoName ? daoName : "")

    return (
        <DaoContext.Provider value={daoMeta}>{children}</DaoContext.Provider>
    )
}