import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { VoterStakeRegistry } from "./idl";
import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";

export const DEFAULT_VSR_PROGRAM_ID = new PublicKey("vsr2nfGVNHmSY8uxoBGqq8AQbwz3JwaEaHqGbsTPXqQ")
export const SCALED_FACTOR_BASE = new BN(1_000_000_000)

export type DepositEntry = IdlTypes<VoterStakeRegistry>["DepositEntry"]
export type Registrar = {
    data: IdlAccounts<VoterStakeRegistry>["registrar"],
    publicKey: PublicKey,
    programId: PublicKey
}

export function registrarKey(realmAddress: PublicKey, tokenMint: PublicKey, programId: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [
            realmAddress.toBuffer(),
            Buffer.from("registrar"),
            tokenMint.toBuffer()
        ],
        programId ?? DEFAULT_VSR_PROGRAM_ID
    )[0]
}

export function vsrRecordKey(realmAddress: PublicKey, tokenMint: PublicKey, authority: PublicKey, programId: PublicKey) {
    const registrar = registrarKey(realmAddress, tokenMint, programId)
    return PublicKey.findProgramAddressSync(
        [
            registrar.toBuffer(),
            Buffer.from("voter-weight-record"),
            authority.toBuffer()
        ],
        programId ?? DEFAULT_VSR_PROGRAM_ID
    )
}

export function voterRecordKey(realmAddress: PublicKey, tokenMint: PublicKey, authority: PublicKey, programId: PublicKey) {
    const registrar = registrarKey(realmAddress, tokenMint, programId)
    return PublicKey.findProgramAddressSync(
        [
            registrar.toBuffer(),
            Buffer.from("voter"),
            authority.toBuffer()
        ],
        programId ?? DEFAULT_VSR_PROGRAM_ID
    )
}

export function computeVsrWeight(
    deposits: IdlTypes<VoterStakeRegistry>["DepositEntry"][],
    votingMints: IdlTypes<VoterStakeRegistry>["VotingMintConfig"][]
) {
    const updatedDeposits = deposits.map(deposit => {
        if (deposit.isUsed) {
            const votingMint = votingMints[deposit.votingMintConfigIdx]
            const baselineWeightPre = votingMint.digitShift > 0 ? 
                deposit.amountDepositedNative.mul(new BN(10).pow(new BN(votingMint.digitShift))) :
                deposit.amountDepositedNative.div(new BN(10).pow(new BN(votingMint.digitShift*-1)))

            const baselineWeight = baselineWeightPre.mul(votingMint.baselineVoteWeightScaledFactor).div(SCALED_FACTOR_BASE)


            const maxLockedWeightPre = votingMint.digitShift > 0 ? 
                deposit.amountInitiallyLockedNative.mul(new BN(10).pow(new BN(votingMint.digitShift))) :
                deposit.amountInitiallyLockedNative.div(new BN(10).pow(new BN(votingMint.digitShift*-1)))

            const maxLockedWeight = maxLockedWeightPre.mul(votingMint.maxExtraLockupVoteWeightScaledFactor).div(SCALED_FACTOR_BASE)
            
            const saturatedSecs = votingMint.lockupSaturationSecs

            const currentTs = new BN(Math.floor(Date.now()/1000))
            const currentTsAdjusted = deposit.lockup.kind.constant ? deposit.lockup.startTs : currentTs

            const isExpired = currentTsAdjusted.gte(deposit.lockup.endTs)

            const lockedWeight = isExpired ? new BN(0) :
                maxLockedWeight.eq(new BN(0)) ? new BN(0) :
                deposit.lockup.kind.none ? 
                    new BN(0) :
                deposit.lockup.kind.daily ? 
                    votingPowerLinearVesting(maxLockedWeight, saturatedSecs, true, votingMint, deposit, currentTs, currentTsAdjusted) :
                deposit.lockup.kind.monthly ? 
                    votingPowerLinearVesting(maxLockedWeight, saturatedSecs, false, votingMint, deposit, currentTs, currentTsAdjusted) :
                deposit.lockup.kind.cliff || deposit.lockup.kind.constant  ?
                    votingPowerCliff(currentTsAdjusted, maxLockedWeight, saturatedSecs, deposit) :
                    new BN(0)

            return baselineWeight.add(lockedWeight)
        } else {
            return new BN(0)
        }
    })

    return updatedDeposits.reduce((a,b) => a.add(b), new BN(0))
}

function votingPowerLinearVesting(
    maxLockedVoteWeight: BN,
    saturationSecs: BN,
    isDaily: boolean,
    votingMint: IdlTypes<VoterStakeRegistry>["VotingMintConfig"],
    deposit: IdlTypes<VoterStakeRegistry>["DepositEntry"],
    currentTs: BN,
    currentTsAdjusted: BN
) {
    const periodSecs = isDaily ? new BN(86400) : new BN(2_628_000)
    const periodSecsSaturated = periodSecs.sub(new BN(1))

    
    const periodLeft = currentTs < deposit.lockup.startTs ? 
        deposit.lockup.endTs.sub(deposit.lockup.startTs).div(periodSecs) :
        deposit.lockup.endTs.sub(currentTsAdjusted).add(periodSecsSaturated).div(periodSecs)
    
    const periodTotal = deposit.lockup.endTs.sub(deposit.lockup.startTs).div(periodSecs)

    const secsToClosestCliff = deposit.lockup.endTs.sub(currentTsAdjusted).sub(periodSecs.mul(periodLeft.sub(new BN(1))))

    if (secsToClosestCliff.gte(saturationSecs)) {
        return maxLockedVoteWeight
    }

    const denominator = periodTotal.mul(saturationSecs)
    const lockupSaturationPeriods = (saturationSecs.sub(secsToClosestCliff).add(periodSecs)).div(periodSecs)

    const q = BN.min(lockupSaturationPeriods, periodLeft)
    const r = periodLeft.sub(q)
    const sumFullPeriods = q.mul(q.sub(new BN(1))).div(new BN(2))
    const lockupSecsFractional = q.mul(secsToClosestCliff)
    const lockupSecsFull = sumFullPeriods.mul(periodSecs)
    const lockupSecsSaturated = r.mul(saturationSecs)
    const lockupSecs = lockupSecsFractional.add(lockupSecsFull).add(lockupSecsSaturated)

    return maxLockedVoteWeight.mul(lockupSecs).div(denominator)
}

function votingPowerCliff(
    currentTsAdjusted: BN,
    maxLockedVoteWeight: BN,
    saturatedSecs: BN,
    deposit: IdlTypes<VoterStakeRegistry>["DepositEntry"]
) {
    const remaining = BN.min(deposit.lockup.endTs.sub(currentTsAdjusted), saturatedSecs)
    return maxLockedVoteWeight.mul(remaining).div(saturatedSecs)
}