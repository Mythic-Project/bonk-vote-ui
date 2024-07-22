import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const urlRegex =
  // eslint-disable-next-line
  /(https:\/\/)(gist\.github.com\/)([\w\/-]{1,39}\/)([\w-]{1,32})/

export function useGetProposalBody(
  proposalAddress: string,
  proposalBody: string
) {
  return useQuery({
    queryKey: ['get-proposal-body', {proposal: proposalAddress}],
    queryFn: async(): Promise<string | null> => {

    try {
      const uriInfo = await fetchGistFile(proposalBody)
      return uriInfo
    } catch {
      return null
    }  
  },
    refetchOnWindowFocus: false,
    staleTime: Infinity
  })
}

async function fetchGistFile(gistUrl: string) {
  const controller = new AbortController()
  
  const pieces = gistUrl.match(urlRegex)

  if (pieces) {
    const justIdWithoutUser = pieces[4]
    if (justIdWithoutUser) {
      const apiUrl = 'https://api.github.com/gists/' + justIdWithoutUser
      const apiResponse = await axios.get(apiUrl, {
        signal: controller.signal,
      })
      if (apiResponse.status === 200) {
        const jsonContent = apiResponse.data
        const nextUrlFileName = Object.keys(jsonContent['files'])[0]
        const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url']
        if (nextUrl.startsWith('https://gist.githubusercontent.com/')) {
          const fileResponse = await axios.get(nextUrl, {
            signal: controller.signal,
          })
          return fileResponse.data
        }
        return null
      } else {
        console.warn('could not fetchGistFile', {
          gistUrl,
          apiResponse: apiResponse.data,
        })
      }
    }
  }

  return null
}