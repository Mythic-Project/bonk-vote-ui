import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {  useGetVsrVoter } from "./useVsr";
import { VoteRecordWithGov } from "./useVoteRecord";
import { useGetTokenOwnerRecord } from "./useVoterRecord";
import { VsrClient } from "../plugin/VoterStakeRegistry/client";
import vsrTransitionTokensHandler from "../actions/vsrTransitionTokens";

export function useVsrTransitionTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const tokenOwnerRecord = useGetTokenOwnerRecord(name).data
    const client = useQueryClient()
    const vsrRecord = useGetVsrVoter(name).data
    
    return useMutation({
      mutationKey: ["vsr-transition-tokens-mutation", {name, publicKey: wallet.publicKey}],
      mutationFn: async(
          { voteRecords}:
          {voteRecords: VoteRecordWithGov[]}
      ) => {

        if (
          !selectedRealm || !wallet.publicKey || 
          tokenOwnerRecord === undefined || !vsrRecord
        ) {
          return null
        }
    
        const vsrClient = VsrClient(connection)
        const govClient = new Governance(connection)
        const publicKey = wallet.publicKey
        
        const sig = await vsrTransitionTokensHandler(
          connection,
          wallet,
          govClient,
          new PublicKey(selectedRealm.realmId),
          new PublicKey(selectedRealm.tokenMint),
          publicKey,
          tokenOwnerRecord,
          voteRecords,
          vsrClient,
          vsrRecord
        )

        return sig
      },
      onSuccess: async() => {
        client.resetQueries({
          queryKey: ['get-token-record', {name, tokenOwner: wallet.publicKey}]
        })
        
        await client.invalidateQueries({
          queryKey: ['get-token-record', {name, tokenOwner: wallet.publicKey}]
        })
        await client.invalidateQueries({
          queryKey: [
            'get-tokens-holding', {name, publicKey: wallet.publicKey}]
        })
      }
    })
}