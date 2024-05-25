import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useGetRealmMeta } from "./useRealm"
import { useQuery } from "@tanstack/react-query"
import { PublicKey } from "@solana/web3.js"
import { Governance, VoteRecord } from "test-governance-sdk"
import { useGetProposals } from "./useProposal"
import { useGetDelegateRecords, useGetTokenOwnerRecord } from "./useVoterRecord"

export interface VoteRecordWithGov extends VoteRecord {
    governance: PublicKey
}

export function useGetVoteRecords(name: string) {
    const {connection} = useConnection()
    const {publicKey} = useWallet()
    const selectedRealm = useGetRealmMeta(name)
    const proposals = useGetProposals(name).data

    return useQuery({
        enabled: proposals !== undefined,
        queryKey: ['get-vote-records', {
            name,
            voter: publicKey
        }],
        queryFn: async(): Promise<VoteRecordWithGov[] | null> => {
            if (!publicKey || !selectedRealm || !proposals) {
                return null
            }
            
            const {programId} = selectedRealm

            const daoProgramId = new PublicKey(programId)
            const govRpc = new Governance(connection, daoProgramId)

            try {
                const unrelquishVoteRecords = await govRpc.getVoteRecordsForUser(publicKey, true)
                console.log("fetched vote records")
                
                const voteRecordsWithGov = unrelquishVoteRecords.flatMap((voteRecord) => {
                    const proposal = proposals.find(
                        proposal => proposal.publicKey.equals(voteRecord.proposal)
                    )
                    return proposal ?
                        [{...voteRecord, governance: proposal.governance}] :
                        []
                })

                return voteRecordsWithGov
            } catch {
                return null
            }
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}

export function useGetVoteRecordsForProposal(name: string, proposal: PublicKey) {
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const tokenOwnerRecord = useGetTokenOwnerRecord(name).data
    const delegateRecords = useGetDelegateRecords(name).data
    const {publicKey} = useWallet()

    const enabled = tokenOwnerRecord !== undefined &&
        delegateRecords !== undefined

    return useQuery({
        enabled,
        queryKey: ['get-vote-records', {
            name,
            proposal,
            voter: publicKey
        }],
        queryFn: async(): Promise<VoteRecord[] | null> => {
            if (!publicKey || !selectedRealm) {
                return null
            }
            
            const voteRecordsForProposal: VoteRecord[] = []

            const {programId} = selectedRealm
            const govRpc = new Governance(connection, new PublicKey(programId))

            if (tokenOwnerRecord) {
                const selfVoteRecordKey = govRpc.pda.voteRecordAccount({
                    proposal, tokenOwnerRecord: tokenOwnerRecord.publicKey}
                ).publicKey

                try {
                    const selfVoteRecord = await govRpc.getVoteRecordByPubkey(selfVoteRecordKey)
                    voteRecordsForProposal.push(selfVoteRecord)
                } catch {
                }
            }

            if (delegateRecords) {
                for (const record of delegateRecords) {
                    const voteRecordKey = govRpc.pda.voteRecordAccount({
                        proposal, tokenOwnerRecord: record.publicKey}
                    ).publicKey

                    try {
                        const voteRecord = await govRpc.getVoteRecordByPubkey(voteRecordKey)
                        voteRecordsForProposal.push(voteRecord)
                    } catch {
                    }                    
                }
            }

            console.log(`fetched vote records for the proposal ${proposal.toBase58()}`)
            return voteRecordsForProposal
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
}