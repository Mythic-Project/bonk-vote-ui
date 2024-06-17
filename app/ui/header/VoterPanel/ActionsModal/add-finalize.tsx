import { StandardButton } from "@/app/ui/buttons";
import { MdOutlineCheckCircleOutline } from "react-icons/md";

function AddFinalize(
  {borderColor, buttonColor, closeModal} :
  {borderColor: string, buttonColor: string, closeModal: () => void}
) {
  return (
    <div className="w-72 flex flex-col items-center text-center gap-2">
      <MdOutlineCheckCircleOutline className="text-5xl text-secondary-text"/>
      <h3 className="font-semibold text-primary-text">You just added tokens</h3>
      <p className="text-sm text-secondary-text">Your can now vote on proposals.</p>
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

export default AddFinalize