import type { Address, KeyPairSigner } from '@solana/kit'
import {
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/kit'
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '@solana-program/token-2022'

/**
 * Transfer Token-2022 tokens from the fee payer to a recipient.
 * Creates the recipient's ATA if it doesn't exist (idempotent).
 * Returns the transaction signature.
 */
export async function transferToken({
  amount,
  decimals,
  feePayer,
  mint,
  recipient,
  rpcUrl,
}: {
  amount: bigint
  decimals: number
  feePayer: KeyPairSigner
  mint: Address
  recipient: Address
  rpcUrl: string
}): Promise<string> {
  const wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://')
  const rpc = createSolanaRpc(rpcUrl)
  const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl)

  // Find ATAs
  const [sourceAta] = await findAssociatedTokenPda({
    mint,
    owner: feePayer.address,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  })

  const [destinationAta] = await findAssociatedTokenPda({
    mint,
    owner: recipient,
    tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
  })

  // Create destination ATA if needed (idempotent)
  const createAtaInstruction =
    await getCreateAssociatedTokenIdempotentInstructionAsync({
      mint,
      owner: recipient,
      payer: feePayer,
    })

  // Transfer tokens
  const transferInstruction = getTransferCheckedInstruction({
    amount,
    authority: feePayer,
    decimals,
    destination: destinationAta,
    mint,
    source: sourceAta,
  })

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createAtaInstruction, transferInstruction],
        tx,
      ),
  )

  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage)

  // The sendAndConfirmTransactionFactory generic expects a specific cluster type.
  // Using `as Parameters<...>[0]` to satisfy the type constraint while keeping
  // runtime behavior correct (blockhash lifetime is set via pipe above).
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  } as Parameters<typeof sendAndConfirmTransactionFactory>[0])
  await sendAndConfirm(
    signedTransaction as Parameters<typeof sendAndConfirm>[0],
    { commitment: 'confirmed', skipPreflight: true },
  )

  return getSignatureFromTransaction(signedTransaction)
}
