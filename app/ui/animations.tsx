export function Spinner({mainColor}: {mainColor: string}) {
    return (
        <div className="animate-spin h-4 w-4 rounded-full border-2 border-primary-text"
            style={{borderTopColor: mainColor}}
        >
        </div>
    )
}

export function PulseModal({primaryBackground}: {primaryBackground: string}) {
    return (
        <div className="shadow rounded-md p-4 w-full mx-auto" style={{backgroundColor: primaryBackground}}>
            <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-dark-shade h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                    <div className="w-full flex justify-between">
                        <div className="w-1/4">
                            <div className="h-2 bg-dark-shade rounded-xl"></div>
                            <div className="h-2 bg-dark-shade rounded-xl mt-2 w-2/3"></div>
                        </div>
                        <div className="w-1/4">
                            <div className="h-4 bg-dark-shade rounded-xl"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-dark-shade rounded-xl col-span-3"></div>
                        </div>
                        <div className="h-6 bg-dark-shade rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function CommentsPulseModal({primaryBackground, secondaryBackground}: {primaryBackground: string, secondaryBackground: string}) {
    return (
        <div className="shadow rounded-md p-4 w-full mx-auto" style={{backgroundColor: primaryBackground}}>
            <hr className="border-[1px] w-full mb-6" style={{borderColor: secondaryBackground}} />
            <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-dark-shade h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                    <div className="w-full flex justify-between">
                        <div className="w-1/4">
                            <div className="h-2 bg-dark-shade rounded-xl"></div>
                            <div className="h-2 bg-dark-shade rounded-xl mt-2 w-2/3"></div>
                        </div>
                        <div className="w-1/4">
                            <div className="h-4 bg-dark-shade rounded-xl"></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4">
                        <div className="h-4 bg-dark-shade rounded-xl col-span-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}