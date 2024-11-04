import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance, TokenOwnerRecord } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetRegistrar } from "./useVsr";
import transitionTokensHandler from "../actions/transitionTokens";
import { VoteRecordWithGov } from "./useVoteRecord";
import { BonkPluginClient } from "../plugin/BonkPlugin/client";
import { useGetTokenOwnerRecord } from "./useVoterRecord";
import { TokenVoterClient } from "../plugin/TokenVoter/client";

export function useTransitionTokens(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const registrar = useGetRegistrar(name).data
    const tokenOwnerRecord = useGetTokenOwnerRecord(name).data
    const client = useQueryClient()

    return useMutation({
      mutationKey: ["transition-tokens-mutation", {name, publicKey: wallet.publicKey}],
      mutationFn: async(
          {amount, voteRecords}:
          {voteRecords: VoteRecordWithGov[], amount?: BN}
      ) => {

        if (!selectedRealm || !wallet.publicKey || !registrar || tokenOwnerRecord === undefined) {
          return null
        }
    
        const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
        const bonkClient = BonkPluginClient(connection)
        const tokenClient = TokenVoterClient(connection)
        const publicKey = wallet.publicKey
        
        const sig = await transitionTokensHandler(
          connection,
          wallet,
          govClient,
          new PublicKey(selectedRealm.realmId),
          new PublicKey(selectedRealm.tokenMint),
          publicKey,
          registrar,
          bonkClient,
          tokenClient,
          voteRecords,
          tokenOwnerRecord,
          amount
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