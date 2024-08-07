import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VsrClient } from "../plugin/VoterStakeRegistry/client";
import { useGetRegistrar } from "./useVsr";
import transitionTokensHandler from "../actions/transitionTokens";
import { VoteRecordWithGov } from "./useVoteRecord";

export function useTransitionTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const client = useQueryClient()

    return useMutation({
      mutationKey: ["transition-tokens-mutation", {name, publicKey: wallet.publicKey}],
      mutationFn: async(
          {amount, voteRecords, tokenOwnerRecord}:
          {amount: BN, voteRecords: VoteRecordWithGov[], tokenOwnerRecord: TokenOwnerRecord}
      ): Promise<string | null> => {

        if (!selectedRealm || !wallet.publicKey || !registrar) {
            return null
        }
    
        const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
        const vsrClient = VsrClient(connection, registrar.programId)
        const publicKey = wallet.publicKey
        
        const sig = await transitionTokensHandler(
          connection,
          wallet,
          govClient,
          new PublicKey(selectedRealm.realmId),
          new PublicKey(selectedRealm.tokenMint),
          publicKey,
          amount,
          registrar,
          vsrClient,
          voteRecords,
          tokenOwnerRecord
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
        await client.invalidateQueries({
            queryKey: ['get-voter-weight', {name, tokenOwner: wallet.publicKey}]
        })
      }
    })
}