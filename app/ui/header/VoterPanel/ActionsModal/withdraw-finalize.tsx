import { StandardButton } from "@/app/ui/buttons";
import { MdOutlineSend } from "react-icons/md";

function WithdrawFinalize(
  {borderColor, buttonColor, closeModal} :
  {borderColor: string, buttonColor: string, closeModal: () => void}
) {
  return (
    <div className="w-72 flex flex-col items-center text-center gap-2">
      <MdOutlineSend className="text-5xl text-secondary-text"/>
      <h3 className="font-semibold text-primary-text">You just withdrew your tokens</h3>
      <p className="text-sm text-secondary-text">Your votes on active proposals have now been removed.</p>
      <hr className="border-[1px] w-full my-4" style={{borderColor}}/>
      <StandardButton
        title="Close"
        style={{backgroundColor: buttonColor}}
        vibrant={true}
        onClick={closeModal}
      />
    </div>
  )
}

export default WithdrawFinalize