'use client'

import { RealmMetaType } from "@/app/hooks/useRealm";
import { useDaoMeta } from "@/app/providers/dao-provider";
import { useState } from "react"
import {LuFilter, LuSearch} from "react-icons/lu"

export function SearchBar() {
    const daoMeta = useDaoMeta() as RealmMetaType
    const [showSearchIcon, setShowSearchIcon] = useState(true);

    const handleChange = (text: string) => {
        if (text.length) {
            setShowSearchIcon(false)
        } else {
            setShowSearchIcon(true)
        }
    }

    return (
        <div className="text-primary-text flex gap-4">
            <div className="relative">
                <input type="text" className="p-4 rounded-lg text-sm z-20 text-secondary-text"
                    style={{backgroundColor: daoMeta.primaryBackground}}
                    onChange={(e) => handleChange(e.target.value)}
                />
                {
                    showSearchIcon &&
                    <div className="absolute flex gap-2 top-[16px] left-5 z-15 items-center">
                        <LuSearch className=" text-placeholder-shade"/>
                        <span className="text-placeholder-shade font-light text-sm">Search</span>
                    </div>
                }
            </div>
            <div className="p-4 rounded-lg" style={{backgroundColor: daoMeta.primaryBackground}}>
                <LuFilter className="text-placeholder-shade text-lg" />
            </div>
        </div>
    )
}