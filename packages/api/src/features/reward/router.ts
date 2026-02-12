import { ORPCError } from '@orpc/server'
import type { Address } from '@solana/kit'
import { db } from '@solana-stack-attack/db'
import { walletAddress } from '@solana-stack-attack/db/schema/auth'
import { reward } from '@solana-stack-attack/db/schema/reward'
import { env } from '@solana-stack-attack/env/server'
import {
  getFeePayer,
  TOKEN_CONFIG,
  transferToken,
} from '@solana-stack-attack/solana-client'
import { and, eq } from 'drizzle-orm'
import z from 'zod'

import { protectedProcedure } from '../../index'

export const rewardRouter = {
  // List current user's rewards
  list: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id

    const rewards = await db
      .select()
      .from(reward)
      .where(eq(reward.userId, userId))
      .orderBy(reward.createdAt)

    return rewards.map((r) => ({
      ...r,
      // Convert to human-readable amount for display
      displayAmount: r.amount / 10 ** TOKEN_CONFIG.decimals,
    }))
  }),

  // Claim a reward — transfer tokens to user's wallet
  claim: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id

      // Get the reward
      const [rewardRecord] = await db
        .select()
        .from(reward)
        .where(and(eq(reward.id, input.id), eq(reward.userId, userId)))
        .limit(1)

      if (!rewardRecord) {
        throw new ORPCError('NOT_FOUND', { message: 'Reward not found' })
      }

      if (rewardRecord.status === 'claimed') {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Reward already claimed',
        })
      }

      // Get user's wallet address
      const [wallet] = await db
        .select()
        .from(walletAddress)
        .where(eq(walletAddress.userId, userId))
        .limit(1)

      if (!wallet) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'No wallet address found. Please connect a wallet first.',
        })
      }

      // Check env vars
      if (!env.FEE_PAYER_KEYPAIR) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Token transfer not configured',
        })
      }

      if (!env.TOKEN_MINT_ADDRESS) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Token mint not configured',
        })
      }

      // Transfer tokens
      const feePayer = await getFeePayer(env.FEE_PAYER_KEYPAIR)
      const txSignature = await transferToken({
        amount: BigInt(rewardRecord.amount),
        decimals: TOKEN_CONFIG.decimals,
        feePayer,
        mint: env.TOKEN_MINT_ADDRESS as Address,
        recipient: wallet.address as Address,
        rpcUrl: env.SOLANA_RPC_URL,
      })

      // Update reward record
      const [updated] = await db
        .update(reward)
        .set({
          claimedAt: new Date(),
          status: 'claimed',
          txSignature,
        })
        .where(eq(reward.id, input.id))
        .returning()

      if (!updated) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: 'Failed to update reward',
        })
      }

      return {
        ...updated,
        displayAmount: updated.amount / 10 ** TOKEN_CONFIG.decimals,
      }
    }),
}
