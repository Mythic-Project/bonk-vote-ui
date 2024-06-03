import { PublicKey } from "@solana/web3.js"

function ProfileImage(
  {image, backgroundColor, fallbackAddress}:
  {
    backgroundColor: string,
    fallbackAddress: PublicKey,
    image?: string}
) {
  return (
    image?
      <img src={image} width={40} height={40} alt="" className="rounded-full"/> :
      <div 
        className="w-10 h-10 rounded-full text-primary-text flex items-center justify-center" 
        style={{backgroundColor}}
      >
        <span>
          {fallbackAddress.toBase58().substring(0, 2)}
        </span>
      </div>
  )
}

export default ProfileImage