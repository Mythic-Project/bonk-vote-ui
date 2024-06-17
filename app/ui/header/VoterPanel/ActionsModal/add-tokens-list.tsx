"use client"

import { RealmMetaType } from "@/app/hooks/useRealm"
import { TokenHoldingReturnType } from "@/app/hooks/useToken"
import { useDaoMeta } from "@/app/providers/dao-provider"
import { ellipsify } from "@/app/utils/ui-utils"
import { Balance } from "./balance"
import { useGetDaoMintData } from "@/app/hooks/useMint"
import Image from "next/image"


function AddTokensList(
{
  tokensHolding,
  selectedToken,
  setSelectedToken
} : {
  tokensHolding: TokenHoldingReturnType[],
  selectedToken: number,
  setSelectedToken: (t: number) => void
}) {
  const realmMeta = useDaoMeta() as RealmMetaType
  const mintInfos = useGetDaoMintData(realmMeta.name).data

  return (
    <div className="flex gap-4 text-sm mb-4">
      {tokensHolding.map((holding, index) => (
          <div 
              className="border-[1px] p-2 rounded-lg cursor-pointer flex flex-col gap-2 items-center min-w-24 justify-evenly" 
              key={holding.mint.toBase58()}
              style={{
                  backgroundColor: selectedToken === index ? realmMeta.secondaryBackground : realmMeta.optionsDark, 
                  borderColor: realmMeta.optionsSelected 
              }}
              onClick={() => setSelectedToken(index)}
          >
            {mintInfos && <div className="flex gap-2">
              {mintInfos.find(m => m.address.equals(holding.mint))!.image ?
                <img src={
                  mintInfos.find(m => m.address.equals(holding.mint))!.image ??
                  ""
                  } 
                  width={20} height={20} alt="mint logo"
                /> :
                <div className="w-5 h-5 rounded-full bg-slate-50"></div>
              }
              <span>
                {
                  mintInfos ?
                    mintInfos.find(m => m.address.equals(holding.mint))!.name ?
                    mintInfos.find(m => m.address.equals(holding.mint))!.name :
                    ellipsify(holding.mint.toBase58(), 2) :
                    ellipsify(holding.mint.toBase58(), 2)
                }
              </span>
            </div>}
            <div className="">
              <span className="flex gap-1 text-xs">{<Balance holding={holding} />}</span>
            </div>
          </div>
      ))}
  </div>
  )
}

export default AddTokensList