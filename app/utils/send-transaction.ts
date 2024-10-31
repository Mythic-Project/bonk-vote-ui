import {utils} from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, Connection, Keypair, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

async function sendTransaction(
    connection: Connection,
    instructions: TransactionInstruction[],
    wallet: WalletContextState,
    chunks?: number,
    signers?: Keypair,
    useDefaultCULimit?: boolean
) {
    if (!wallet.publicKey) {
        throw new Error("The wallet is not connected.")
    }

    const recentBlockhash = await connection.getLatestBlockhash({
        commitment: "confirmed"
    })

    const ixsChunks: TransactionInstruction[][] = []
    const len = instructions.length

    if (chunks && len > chunks) {
        let chunk = 0
        while (chunk < len) {
            ixsChunks.push(instructions.slice(chunk, chunk+chunks))
            chunk += chunks
        }
    } else {
        ixsChunks.push(instructions)
    }

    ixsChunks.forEach(ixs => {
        ixs.unshift(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1_000_000
            })
        )
    })

    const txs: VersionedTransaction[] = []
    
    for (const ixs of ixsChunks) {
        const mockTxMessage = new TransactionMessage({
            payerKey: wallet.publicKey,
            recentBlockhash: recentBlockhash.blockhash,
            instructions: ixs
        }).compileToV0Message()
    
        const mockTx = new VersionedTransaction(mockTxMessage)
        
        const simulateResult = await connection.simulateTransaction(mockTx, {
            commitment: "confirmed"
        })
    
        if (simulateResult.value.err) {
            const errObj = simulateResult.value.err as any

            if (errObj.InstructionError && errObj.InstructionError[1].Custom !== 506 && 
                errObj.InstructionError && errObj.InstructionError[1].Custom !== 1101
            ) {
                console.log(simulateResult.value.accounts)
                console.log(simulateResult.value.logs)
                throw new Error(`Transaction simulation failed. Error: ${JSON.stringify(
                    simulateResult.value.err
                )}`)
            }
        }
    
        const CU_UNITS = simulateResult.value.unitsConsumed
    
        if (CU_UNITS) {
            ixs.unshift(
                ComputeBudgetProgram.setComputeUnitLimit({
                    units: useDefaultCULimit ? 200_000 : CU_UNITS * 1.2,
                })
            )
        }
    
        const txMessage = new TransactionMessage({
            payerKey: wallet.publicKey,
            instructions: ixs,
            recentBlockhash: recentBlockhash.blockhash
        }).compileToV0Message()
    
        const tx = new VersionedTransaction(txMessage)
        txs.push(tx)
    }

    const signedTxs = await wallet.signAllTransactions!(txs)

    if (signers) {
        // Additional signer for post chat message ix, need to improve the signing logic
        signedTxs[signedTxs.length-1].sign([signers])
    }

    let finalTxSig = ""
    for (const signedTx of signedTxs) {
        let txSignature = null
        let confirmTransactionPromise = null
        let confirmedTx = null
    
        const signatureRaw = signedTx.signatures[0]
        txSignature = utils.bytes.bs58.encode(signatureRaw)
        
        let txSendAttempts = 1
    
        try {
            console.log(`${new Date().toISOString()} Subscribing to transaction confirmation`);
        
            confirmTransactionPromise = connection.confirmTransaction(
                {
                    signature: txSignature,
                    blockhash: recentBlockhash.blockhash,
                    lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
                },
                "confirmed"
            );
        
            console.log(`${new Date().toISOString()} Sending Transaction ${txSignature}`);
    
            await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                maxRetries: 0,
            });
        
            confirmedTx = null
            while (!confirmedTx) {
                confirmedTx = await Promise.race([
                    confirmTransactionPromise,
                    new Promise((resolve) =>
                        setTimeout(() => {
                            resolve(null);
                        }, 3000)
                    )
                ])
    
                if (confirmedTx) {
                    break
                }
        
                console.log(`${new Date().toISOString()} Tx not confirmed after ${3000 * txSendAttempts++}ms, resending`);
        
                await connection.sendRawTransaction(signedTx.serialize(), {
                    skipPreflight: false,
                    maxRetries: 0,
                });
            }
        } catch (error) {
            console.error(error);
            throw new Error(JSON.stringify(error))
        }

        if (!confirmedTx) {
            console.log("Transaction Failed!")
            throw new Error("Transaction Failed")
        }
    
        console.log("Transaction is successful.", txSignature)
        finalTxSig = txSignature
    }

    return finalTxSig
}

export default sendTransaction