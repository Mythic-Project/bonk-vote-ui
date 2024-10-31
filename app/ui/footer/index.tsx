import Image from "next/image";
import Link from "next/link";
import CreateRegistrar from "./createRegistrar";

export function Footer() {
    return (
        <div className="m-8 w-full flex flex-col items-center gap-3 text-xs text-secondary-text">
            <CreateRegistrar />
            <div className="flex items-center gap-4">
                <Link href="#">
                    <Image src="/image/github.png" width={36} height={36} alt="github" />
                </Link>
                <Link href="#">
                    <Image src="/image/twitter.png" width={36} height={36} alt="github" />
                </Link>
                <Link href="#">
                    <Image src="/image/discord.png" width={36} height={36} alt="github" />
                </Link>
            </div>
            <div className="flex gap-2">
                <p className="">&copy; 2024 Realms Today Ltd.</p> |
                <Link href="#" className="underline">Terms</Link> |
                <Link href="#" className="underline">Privacy Policy</Link>
            </div>
            <Link href="#" className="">Read the docs</Link>
            <p className="">
                Powered by 
                <span className="font-semibold"> Solana</span>
            </p>
        </div>
    )
}