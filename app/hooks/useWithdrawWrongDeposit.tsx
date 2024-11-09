import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useGetRealmMeta } from "./useRealm";
import { Governance } from "test-governance-sdk";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetTokenOwnerRecord } from "./useVoterRecord";
import withdrawWrongDepositHandler from "../actions/withdrawWrongDeposit";
import { VoteRecordWithGov } from "./useVoteRecord";

export function useWithdrawWrongDeposit(name: string) {
    const wallet = useWallet()
    const {connection} = useConnection()
    const selectedRealm = useGetRealmMeta(name)
    const tokenOwnerRecord = useGetTokenOwnerRecord(name).data
    const client = useQueryClient()

    return useMutation({
      mutationKey: ["withdraw-wrong-deposit-mutation", {name, publicKey: wallet.publicKey}],
      mutationFn: async( {voteRecords} : {voteRecords: VoteRecordWithGov[]}
    ) => {

    if (!selectedRealm || !wallet.publicKey || tokenOwnerRecord === undefined) {
      return null
    }

    const govClient = new Governance(connection, new PublicKey(selectedRealm.programId))
    const publicKey = wallet.publicKey
    
    const sig = await withdrawWrongDepositHandler(
      connection,
      wallet,
      govClient,
      new PublicKey(selectedRealm.realmId),
      new PublicKey(selectedRealm.tokenMint),
      publicKey,
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
      }
    })
}