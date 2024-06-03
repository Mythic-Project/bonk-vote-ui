
import {CivicProfile} from "@civic/profile"
import { useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

export function useGetCivicIdentity(user?: PublicKey) {
  const {connection} = useConnection()

  return useQuery({
      queryKey: ['get-civic-profile', {user}],
      queryFn: async() => {   
        try {
          if (!user) {
            return null
          }

          const profile = await CivicProfile.get(
            user.toBase58(),
            {
              solana: {connection}
            }
          )

          return profile
        } catch {
          return null
        }
      },
      refetchOnWindowFocus: false,
      staleTime: Infinity
  })
}