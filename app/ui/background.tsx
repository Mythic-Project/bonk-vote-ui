'use client'

import { RealmMetaType } from "../hooks/useRealm"
import { useDaoMeta } from "../providers/dao-provider"

export function GradientBackground() {
    return (
        <div className="w-full absolute top-[-64px] flex justify-evenly">
           <BlurDiv />
            <BlurDiv />
        </div>
    )
}

function BlurDiv() {
    const daoMeta = useDaoMeta() as RealmMetaType

    return (
        <div 
            className="w-full sm:w-1/3 h-32 blur-xl rounded-full opacity-60" 
            style={{
                backgroundImage: `linear-gradient(to right, ${daoMeta.gradientTwo}, ${daoMeta.mainColor}`,
                boxShadow: `
                    ${(Math.random()*50).toFixed(0)}px 
                    ${(Math.random()*50).toFixed(0)}px ${(Math.random()*75).toFixed(0)}px ${daoMeta.thirdColor}`
            }}
        >
        </div>
    )
}