import clsx from "clsx"
import { ReactNode } from "react"

export function StandardButton(
    {title, vibrant, onClick, addStyles, disabled, style, customPad}:
    {
        title: ReactNode,
        style?: any
        vibrant?: boolean,
        onClick?: () => void,
        disabled?: boolean, 
        addStyles?: string,
        customPad?: string
    }
) {
    return (
        <button className={clsx(
            {
                "text-primary-text": vibrant,
                "text-secondary-text": !vibrant
            }, `text-sm cursor-pointer ${customPad ? customPad : "px-4 py-[6px]"} rounded-lg ${addStyles}`
        )} 
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {title}
        </button>
    )
}

export function ActiveButton(
    {title, disabled, onClick, addStyles, mainColor, actionBackground}:
    {
        title:string, 
        onClick?: () => void,
        disabled?: boolean, 
        addStyles?: string,
        mainColor?: string,
        actionBackground?: string
    }
) {
    return (
        <button 
            className={`${addStyles} text-primary-text text-sm px-4 py-[6px] rounded-lg cursor-pointer`}
            style={{backgroundColor: !disabled && mainColor ? mainColor : actionBackground}}
            disabled={disabled}
            onClick={onClick}
        >
            {title}
        </button>
    )
}