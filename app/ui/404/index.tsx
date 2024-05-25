
function errorPage({error}: {error: string}) {
    return (
        <div className="flex min-h-screen flex-col items-center px-4 md:px-24 py-8 bg-gradient-to-b from-[#181731] to-[#170227]">
            {error}
        </div>
    )
}

export default errorPage

