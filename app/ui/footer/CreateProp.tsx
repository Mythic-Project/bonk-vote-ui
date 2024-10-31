'use client'
import { TokenVoter } from "@/app/plugin/TokenVoter/type"
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import tokenIdl from "../../plugin/TokenVoter/idl.json"
import bonkIdl from "../../plugin/BonkPlugin/idl.json"
import { BonkPlugin } from "@/app/plugin/BonkPlugin/type"
import { Keypair, PublicKey, Transaction } from "@solana/web3.js"
import { registrarKey } from "@/app/plugin/TokenVoter/utils"
import { Governance, RealmConfigArgs } from "test-governance-sdk"
import sendTransaction from "@/app/utils/send-transaction"
export default function CreateRegistrar() {
  const {connection} = useConnection()
  const {publicKey} = useWallet()
  const wallet = useWallet()
  async function create() {
   
    const provider = new AnchorProvider(connection, {} as Wallet)
    const tokenVoterClient = new Program<TokenVoter>(tokenIdl as TokenVoter, provider)
    const bonkClient = new Program<BonkPlugin>(bonkIdl as BonkPlugin, provider)
    const govClient = new Governance(connection)
    if (publicKey) {
      const tx = new Transaction()
      const realm = new PublicKey("84pGFuy1Y27ApK67ApethaPvexeDWA66zNV8gm38TVeQ")
      const governanceProgramId = new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw")
      const governingTokenMint = new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")
      const stakePool = new PublicKey("9AdEE8AAm1XgJrPEs4zkTPozr3o4U5iGbgvPwkNdLDJ3")
      const realmAuthority = new PublicKey("Uq5BRkVfdBpMknZJHw6huS3dunEgJpUDv3M2DG3BfQg")
      const pvsVoterProgramId = new PublicKey("HA99cuBQCCzZu1zuHN2qBxo2FBo1cxNLwKkdt6Prhy8v")
      const councilToken = new PublicKey("G3EzHHXPd434o31FKxd32eYQ673eDjyYiWWNZpMk9ppt")
      const seed = Keypair.generate().publicKey
      // const seed = new PublicKey("GPmUgZdY7R7ov3q56unTKCT9eRKcsXCESx7QGjSXaSJf")
      const proposalKey = govClient.pda.proposalAccount(
        {governanceAccount: realmAuthority, proposalSeed: seed, governingTokenMint: councilToken}
      ).publicKey
      // const proposalKey = new PublicKey("DWvcZcnx5UCULcGwPjYwFvuPf34TJgHT6mviFauzUedf")
      const tokenOwnerRecordAddress = govClient.pda.tokenOwnerRecordAccount({
        realmAccount: realm,
        governingTokenMintAccount: councilToken,
        governingTokenOwner: new PublicKey("8oETCEBmvajGi3G2tLfm4gesigxuE1z7eyLgArRgbU56") // needs to be delegate
      }).publicKey

    const realmData = await govClient.getRealmByPubkey(realm)

    const realmConfig = await govClient.getRealmConfigByRealm(realm)

    const config: RealmConfigArgs = {
        useCouncilMint: realmData.config.councilMint ? true : false,
        minCommunityWeightToCreateGovernance: realmData.config.minCommunityWeightToCreateGovernance,
        communityMintMaxVoterWeightSource: realmData.config.communityMintMaxVoterWeightSource,
        communityTokenConfigArgs: {
          useMaxVoterWeightAddin: false,
          useVoterWeightAddin: true,
          tokenType: {liquid: {}}
        },
        councilTokenConfigArgs: {
          useMaxVoterWeightAddin: false,
          useVoterWeightAddin: false,
          tokenType: {liquid: {}}
        }
      }
  
      const updateRealmConfigIx = await govClient.setRealmConfigInstruciton(
        config,
        realm,
        realmAuthority,
        publicKey,
        councilToken,
        new PublicKey("EoKpGErCsD4UEbbY6LX4MLWBUjmoAxqKdU4fdtLuzK6M")
      )
  
      const proposalIx = await govClient.createProposalInstruction(
        "Update plugin in config",
        "",
        {choiceType: "single", multiChoiceOptions: null},
        ["Approve"],
        true,
        realm,
        realmAuthority,
        tokenOwnerRecordAddress,
        councilToken,
        publicKey,
        publicKey,
        seed
      )
      tx.add(proposalIx)
      
      const innerIxs = [updateRealmConfigIx]
      // for (let i = 0; i<2;i++) {
        const insertIx = await govClient.insertTransactionInstruction(
          [innerIxs[0]], 0, 0, 0, realmAuthority, proposalKey, tokenOwnerRecordAddress, publicKey, publicKey
        )
        tx.add(insertIx)
      // }
      const signOffProposal = await govClient.signOffProposalInstruction(
        realm, realmAuthority, proposalKey, publicKey, undefined, tokenOwnerRecordAddress
      )
      tx.add(signOffProposal)
      
      const tokenOwnerReco = await govClient.getTokenOwnerRecordByPubkey(tokenOwnerRecordAddress)
      console.log(tokenOwnerReco.governanceDelegate, tokenOwnerReco.governingTokenOwner.toBase58())
      await sendTransaction(connection, tx.instructions, wallet, 2, undefined, true)
    }
  }
  return (
    <div className="" onClick={create}>
      <button>Big Button</button>
    </div>
  )
}