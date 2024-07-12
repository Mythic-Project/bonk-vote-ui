import { useConnection } from "@solana/wallet-adapter-react";
import configs from "../../public/config.json";
import { useQuery } from "@tanstack/react-query";
import { Governance } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";

export interface RealmMetaType {
    name: string,
    realmId: string,
    programId: string,
    network: string,
    tokenMint: string,
    tokenType: string,
    banner: string,
    mainColor: string,
    secondaryColor: string,
    thirdColor: string,
    tickColor: string,
    gradientOne: string,
    gradientTwo: string,
    mainBackgroundImg?: string,
    specialBackgroundImg?: string,
    primaryBackground: string,
    primaryBackgroundShade?: string,
    optionsBackground: string,
    secondaryBackground: string,
    optionsSelected: string,
    optionsSequenceColor: string,
    optionsDark: string,
    actionBackground: string,
    activateGradient: boolean,
    useShadeForWallet: boolean
}

export function useGetRealmMeta(name: string) {
    const realms: RealmMetaType[] = configs
    return realms.find(realm => realm.name === name)
}

export function useGetRealmMetaById(id: PublicKey) {
    const realms: RealmMetaType[] = configs
    return realms.find(realm => realm.realmId === id.toBase58())
}

export function useGetRealmData(name: string) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        enabled: selectedRealm !== undefined,
        queryKey: ['get-realm', {name}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const realmKey = new PublicKey(selectedRealm.realmId)
            const programId = new PublicKey(selectedRealm.programId)
            const govRpc = new Governance(connection, programId)

           try {
                const realmData = await govRpc.getRealmByPubkey(realmKey)
                console.log("fetched realm data")
                return realmData
           } catch {
                return null
           }
        },
        refetchOnWindowFocus: false
    })
}

export function useGetRealmConfig(name: string) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)

    return useQuery({
        queryKey: ['get-realm-config', {name}],
        queryFn: async() => {
            if (!selectedRealm) {
                return null
            }
            
            const programId = new PublicKey(selectedRealm.programId)
            const govRpc = new Governance(connection, programId)
            const realmId = new PublicKey(selectedRealm.realmId)
            
            try {
                const realmConfig = await govRpc.getRealmConfigByRealm(realmId)
                console.log("fetched realm config")
                return realmConfig
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}